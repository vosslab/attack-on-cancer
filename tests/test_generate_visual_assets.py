# Standard Library
import pathlib
import xml.etree.ElementTree

# PIP3 modules
import pytest

# local repo modules
import generate_visual_assets


#============================================
def write_sheet(
	path: pathlib.Path,
	kind: str = "enemy",
	key: str = "basic",
	panels: tuple[str, ...] = ("variant-0", "variant-1", "variant-2", "variant-3"),
	panel_content: str = '<g data-aoc-part="membrane"><circle r="4" /></g>',
	defs: str = "",
	editor_content: str = "",
) -> pathlib.Path:
	"""Write one compact inline authoring sheet for boundary tests."""
	panel_markup = ""
	for index, panel in enumerate(panels):
		x = 10 + index * 20
		panel_markup += (
			f'<g data-aoc-panel="{panel}" transform="translate({x} 10)">'
			f"{panel_content}</g>"
		)
	width = len(panels) * 20
	text = (
		f'<svg xmlns="http://www.w3.org/2000/svg" data-aoc-kind="{kind}" '
		f'data-aoc-key="{key}" data-aoc-frame-width="20" '
		f'data-aoc-frame-height="20" viewBox="0 0 {width} 20">'
		f"{defs}{editor_content}{panel_markup}</svg>"
	)
	path.write_text(text, encoding="ascii")
	return path


#============================================
def test_generation_is_deterministic() -> None:
	"""The same authored catalog always produces byte-identical TSX."""
	first = generate_visual_assets.generate_catalog()
	second = generate_visual_assets.generate_catalog()
	assert first == second


#============================================
def test_panel_normalization_removes_editor_material(tmp_path: pathlib.Path) -> None:
	"""Panel layout translations and editor guides never reach runtime markup."""
	path = write_sheet(
		tmp_path / "basic.svg",
		editor_content=(
			'<g data-aoc-editor-only="true"><text x="1" y="2">editor label</text></g>'
		),
	)
	sheet = generate_visual_assets.parse_sheet(path)
	output = "\n".join(generate_visual_assets.panel_function(sheet, sheet.panels[0]))
	assert 'data-aoc-view-box="-10 -10 20 20"' in output
	assert "translate(10 10)" not in output and "editor label" not in output


#============================================
@pytest.mark.parametrize(
	("kind", "key", "panels"),
	[
		("enemy", "basic", ("variant-0", "variant-1", "variant-2")),
		("tower", "doctor", ("tier-0", "tier-1", "tier-2")),
		("death", "apoptosis", ("frame-0", "frame-1", "frame-2", "frame-3")),
	],
)
def test_required_panel_sequences_fail_closed(
	tmp_path: pathlib.Path,
	kind: str,
	key: str,
	panels: tuple[str, ...],
) -> None:
	"""Missing enemy variants, tower tiers, and apoptosis frames are rejected."""
	path = write_sheet(tmp_path / "incomplete.svg", kind=kind, key=key, panels=panels)
	with pytest.raises(ValueError, match="panels must be"):
		generate_visual_assets.parse_sheet(path)


#============================================
def test_unsafe_svg_elements_are_rejected(tmp_path: pathlib.Path) -> None:
	"""Executable SVG content cannot enter generated TSX."""
	content = '<g data-aoc-part="membrane"><script>bad()</script></g>'
	path = write_sheet(tmp_path / "unsafe.svg", panel_content=content)
	with pytest.raises(ValueError, match="unsafe or unsupported SVG element"):
		generate_visual_assets.parse_sheet(path)


#============================================
def test_executable_svg_attributes_are_rejected(tmp_path: pathlib.Path) -> None:
	"""Event-handler attributes cannot enter generated TSX."""
	content = '<g data-aoc-part="membrane"><circle r="4" onclick="bad()" /></g>'
	path = write_sheet(tmp_path / "executable.svg", panel_content=content)
	with pytest.raises(ValueError, match="unsafe or unsupported SVG attribute"):
		generate_visual_assets.parse_sheet(path)


#============================================
def test_dtd_and_entity_declarations_are_rejected(tmp_path: pathlib.Path) -> None:
	"""DTD and entity declarations are rejected before XML parsing."""
	path = tmp_path / "entity.svg"
	path.write_text(
		'<!DOCTYPE svg [<!ENTITY payload "bad">]><svg xmlns="http://www.w3.org/2000/svg" />',
		encoding="ascii",
	)
	with pytest.raises(ValueError, match="DTD and entity declarations are not allowed"):
		generate_visual_assets.parse_sheet(path)


#============================================
def test_external_references_are_rejected(tmp_path: pathlib.Path) -> None:
	"""All href and URL references must stay inside the current SVG sheet."""
	content = '<g data-aoc-part="membrane"><use href="https://example.com/a.svg#x" /></g>'
	path = write_sheet(tmp_path / "external.svg", panel_content=content)
	with pytest.raises(ValueError, match="external SVG reference"):
		generate_visual_assets.parse_sheet(path)


#============================================
def test_mixed_local_and_external_urls_are_rejected(tmp_path: pathlib.Path) -> None:
	"""A valid local URL cannot hide an external URL in the same attribute."""
	path = write_sheet(
		tmp_path / "mixed_urls.svg",
		defs=(
			'<defs><filter id="local-filter">'
			'<feGaussianBlur stdDeviation="1" /></filter></defs>'
		),
		panel_content=(
			'<g data-aoc-part="membrane" '
			'filter="url(#local-filter) url(https://example.com/filter.svg#x)">'
			'<circle r="4" /></g>'
		),
	)
	with pytest.raises(ValueError, match="external or malformed SVG URL"):
		generate_visual_assets.parse_sheet(path)


#============================================
@pytest.mark.parametrize(
	("defs", "content", "message"),
	[
		(
			'<defs><path id="same" d="M0 0" /><path id="same" d="M1 1" /></defs>',
			'<g data-aoc-part="membrane"><circle r="4" /></g>',
			"duplicate SVG id",
		),
		(
			"",
			'<g data-aoc-part="membrane"><use href="#missing" /></g>',
			"unresolved SVG reference",
		),
	],
)
def test_local_reference_integrity(
	tmp_path: pathlib.Path,
	defs: str,
	content: str,
	message: str,
) -> None:
	"""Duplicate IDs and dangling local references fail validation."""
	path = write_sheet(tmp_path / "references.svg", defs=defs, panel_content=content)
	with pytest.raises(ValueError, match=message):
		generate_visual_assets.parse_sheet(path)


#============================================
def test_generated_references_are_namespaced_per_instance() -> None:
	"""Runtime definitions and URL consumers share a stable instance prefix."""
	output = generate_visual_assets.generate_catalog()
	assert 'visualId(props.instanceKey, "enemy-basic", "cell-highlight-gradient")' in output
	assert 'fill="url(#cell-highlight-gradient)"' not in output


#============================================
def test_catalog_has_compile_time_enemy_and_tower_coverage() -> None:
	"""The closed SVG catalog emits TypeScript exhaustiveness contracts."""
	output = generate_visual_assets.generate_catalog()
	assert "Record<EnemyId, readonly number[]>" in output
	assert "Record<TowerId, readonly number[]>" in output
	assert 'macrophage: TowerMacrophageArtwork' in output
	assert 'macrophage: EffectAttackMacrophageState0' in output
	assert 'crispr: TowerCrisprArtwork' in output
	assert 'crispr: EffectAttackCrisprState0' in output
	assert 'export function RepairArtwork' in output


#============================================
def test_world_artwork_type_and_component_follow_validated_sheets(
	tmp_path: pathlib.Path,
) -> None:
	"""A new approved world sheet becomes a typed public generated renderer."""
	sheets = generate_visual_assets.load_sheets(generate_visual_assets.SHEETS_DIR)
	path = write_sheet(
		tmp_path / "capillary_crossroads.svg",
		kind="world",
		key="capillary_crossroads",
		panels=("state-0",),
	)
	campaign_sheet = generate_visual_assets.parse_sheet(path)
	output = generate_visual_assets.render_typescript(sheets + (campaign_sheet,))
	assert '"capillary_crossroads"' in generate_visual_assets.world_artwork_id_type(
		sheets + (campaign_sheet,)
	)
	assert "capillary_crossroads: WorldCapillaryCrossroadsState0" in output


#============================================
def catalog_sheet(kind: str, key: str) -> generate_visual_assets.VisualSheet:
	"""Construct a validated-sheet identity for catalog boundary tests."""
	return generate_visual_assets.VisualSheet(
		pathlib.Path(f"{kind}_{key}.svg"),
		kind,
		key,
		1,
		1,
		xml.etree.ElementTree.Element("svg"),
		(),
	)


#============================================
def test_catalog_requires_core_sheets_and_allows_only_approved_world_sheets() -> None:
	"""Core assets are mandatory; planned world art is optional but closed."""
	core_sheets = tuple(
		catalog_sheet(kind, key)
		for kind, catalog in generate_visual_assets.EXPECTED_CATALOG.items()
		for key in catalog
	)
	optional_world_sheet = catalog_sheet("world", "capillary_crossroads")

	generate_visual_assets.validate_catalog(core_sheets + (optional_world_sheet,))

	with pytest.raises(ValueError, match="missing visual sheets: enemy/basic"):
		generate_visual_assets.validate_catalog(core_sheets[1:])
	with pytest.raises(ValueError, match="unexpected visual sheets: world/unapproved_route"):
		generate_visual_assets.validate_catalog(
			core_sheets + (catalog_sheet("world", "unapproved_route"),)
		)


#============================================
def test_generated_catalog_replaces_output_without_temporary_artifacts(
	tmp_path: pathlib.Path,
	monkeypatch: pytest.MonkeyPatch,
) -> None:
	"""Generated output is replaced atomically instead of exposing a partial file."""
	output_path = tmp_path / "visual_assets" / "index.tsx"
	monkeypatch.setattr(generate_visual_assets, "OUTPUT_FILE", output_path)
	generate_visual_assets.write_catalog_atomically("fresh catalog\n")
	assert output_path.read_text(encoding="ascii") == "fresh catalog\n"
	assert not tuple(output_path.parent.glob("*.tmp"))
