#!/usr/bin/env python3
"""Validate editable SVG sheets and generate SolidJS combat artwork."""

# Standard Library
import re
import sys
import math
import html
import os
import pathlib
import subprocess
import tempfile
import xml.etree.ElementTree  # nosec B405 - declarations are rejected before parsing.


REPO_ROOT = pathlib.Path(
	subprocess.run(
		["git", "rev-parse", "--show-toplevel"],
		check=True,
		capture_output=True,
		text=True,
	).stdout.strip()
)
SHEETS_DIR = REPO_ROOT / "assets" / "visuals"
OUTPUT_FILE = REPO_ROOT / "generated" / "visual_assets" / "index.tsx"
SVG_NAMESPACE = "http://www.w3.org/2000/svg"
MAX_SHEET_BYTES = 512 * 1024

EXPECTED_CATALOG: dict[str, dict[str, tuple[str, ...]]] = {
	"enemy": {
		"basic": ("variant-0", "variant-1", "variant-2", "variant-3"),
		"fast": ("variant-0", "variant-1", "variant-2", "variant-3"),
		"tough": ("variant-0", "variant-1", "variant-2", "variant-3"),
		"dividing": ("variant-0", "variant-1", "variant-2", "variant-3"),
		"immune_evasive": ("variant-0", "variant-1", "variant-2", "variant-3"),
		"tumor_mass": ("state-0",),
	},
	"tower": {
		"doctor": ("tier-0", "tier-1", "tier-2", "tier-3"),
		"chemotherapy": ("tier-0", "tier-1", "tier-2", "tier-3"),
		"t_cell": ("tier-0", "tier-1", "tier-2", "tier-3"),
		"radiation": ("tier-0", "tier-1", "tier-2", "tier-3"),
		"antibody": ("tier-0", "tier-1", "tier-2", "tier-3"),
		"macrophage": ("tier-0", "tier-1", "tier-2", "tier-3"),
		"crispr": ("tier-0", "tier-1", "tier-2", "tier-3"),
	},
	"effect": {
		"attack_doctor": ("state-0",),
		"attack_chemotherapy": ("state-0",),
		"attack_t_cell": ("state-0",),
		"attack_radiation": ("state-0",),
		"attack_antibody": ("state-0",),
		"attack_macrophage": ("state-0",),
		"attack_crispr": ("state-0",),
	},
	"death": {
		"apoptosis": ("frame-0", "frame-1", "frame-2", "frame-3", "frame-4"),
		"rupture": ("state-0",),
	},
	"transition": {
		"repair": ("state-0",),
	},
	"world": {
		"tissue_cell": ("state-0",),
		"tumor_source": ("state-0",),
		"tumor_cluster": ("state-0",),
		"blood_exit": ("state-0",),
	},
}

# These eight authored world-sheet identities complete the campaign world catalog.
WORLD_SHEET_CATALOG: dict[str, tuple[str, ...]] = {
	"capillary_crossroads": ("state-0",),
	"lymph_node_loop": ("state-0",),
	"alveolar_switchbacks": ("state-0",),
	"ductal_delta": ("state-0",),
	"vascular_bypass": ("state-0",),
	"fibrotic_sieve": ("state-0",),
	"marrow_lattice": ("state-0",),
	"metastatic_confluence": ("state-0",),
}

ALLOWED_CATALOG = {
	kind: dict(catalog)
	for kind, catalog in EXPECTED_CATALOG.items()
}
ALLOWED_CATALOG["world"].update(WORLD_SHEET_CATALOG)

ALLOWED_ELEMENTS = {
	"svg",
	"g",
	"defs",
	"title",
	"desc",
	"linearGradient",
	"radialGradient",
	"stop",
	"clipPath",
	"mask",
	"filter",
	"feGaussianBlur",
	"feDropShadow",
	"use",
	"path",
	"circle",
	"ellipse",
	"rect",
	"line",
	"polyline",
	"polygon",
	"text",
}

ALLOWED_ATTRIBUTES = {
	"id",
	"class",
	"viewBox",
	"transform",
	"transform-origin",
	"x",
	"y",
	"x1",
	"x2",
	"y1",
	"y2",
	"cx",
	"cy",
	"r",
	"rx",
	"ry",
	"width",
	"height",
	"d",
	"points",
	"fill",
	"fill-opacity",
	"fill-rule",
	"stroke",
	"stroke-width",
	"stroke-opacity",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-dasharray",
	"stroke-dashoffset",
	"opacity",
	"offset",
	"stop-color",
	"stop-opacity",
	"gradientUnits",
	"gradientTransform",
	"spreadMethod",
	"href",
	"clip-path",
	"mask",
	"filter",
	"filterUnits",
	"stdDeviation",
	"dx",
	"dy",
	"flood-color",
	"flood-opacity",
	"text-anchor",
	"font-size",
	"font-weight",
	"role",
	"aria-label",
	"aria-hidden",
}

ID_PATTERN = re.compile(r"[A-Za-z][A-Za-z0-9_.-]*\Z")
KEY_PATTERN = re.compile(r"[a-z][a-z0-9_]*\Z")
REFERENCE_PATTERN = re.compile(r"url\(#([A-Za-z][A-Za-z0-9_.-]*)\)")
URL_FUNCTION_PATTERN = re.compile(r"url\(", re.IGNORECASE)
TRANSLATE_PATTERN = re.compile(
	r"translate\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))"
	r"(?:\s*,\s*|\s+)"
	r"([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\)\Z"
)


class VisualSheet:
	"""Validated authoring sheet data used by the deterministic renderer."""

	def __init__(
		self,
		path: pathlib.Path,
		kind: str,
		key: str,
		frame_width: float,
		frame_height: float,
		root: xml.etree.ElementTree.Element,
		panels: tuple[xml.etree.ElementTree.Element, ...],
	) -> None:
		self.path = path
		self.kind = kind
		self.key = key
		self.frame_width = frame_width
		self.frame_height = frame_height
		self.root = root
		self.panels = panels


#============================================
def local_name(name: str) -> str:
	"""Return an XML tag or attribute name without its namespace."""
	if name.startswith("{"):
		closing = name.find("}")
		return name[closing + 1 :]
	return name


#============================================
def require_number(value: str | None, label: str, path: pathlib.Path) -> float:
	"""Parse one required positive finite metadata number."""
	if value is None:
		raise ValueError(f"{path}: missing {label}")
	number = float(value)
	if not math.isfinite(number) or number <= 0:
		raise ValueError(f"{path}: {label} must be a positive finite number")
	return number


#============================================
def editor_only(element: xml.etree.ElementTree.Element) -> bool:
	"""Return whether an authoring node is intentionally excluded at runtime."""
	return element.attrib.get("data-aoc-editor-only") == "true"


#============================================
def element_ids(root: xml.etree.ElementTree.Element) -> set[str]:
	"""Validate and return every unique ID declared by a sheet."""
	ids: set[str] = set()
	for element in root.iter():
		identifier = element.attrib.get("id")
		if identifier is None:
			continue
		if ID_PATTERN.fullmatch(identifier) is None:
			raise ValueError(f"invalid SVG id: {identifier}")
		if identifier in ids:
			raise ValueError(f"duplicate SVG id: {identifier}")
		ids.add(identifier)
	return ids


#============================================
def validate_references(root: xml.etree.ElementTree.Element, ids: set[str]) -> None:
	"""Require every reference to be local and resolved within its sheet."""
	for element in root.iter():
		for raw_name, value in element.attrib.items():
			name = local_name(raw_name)
			if name == "href":
				if not value.startswith("#"):
					raise ValueError(f"external SVG reference is not allowed: {value}")
				identifier = value[1:]
				if identifier not in ids:
					raise ValueError(f"unresolved SVG reference: {value}")
			for identifier in REFERENCE_PATTERN.findall(value):
				if identifier not in ids:
					raise ValueError(f"unresolved SVG reference: #{identifier}")
			remaining_value = REFERENCE_PATTERN.sub("", value)
			if URL_FUNCTION_PATTERN.search(remaining_value) is not None:
				raise ValueError(f"external or malformed SVG URL is not allowed: {value}")


#============================================
def validate_elements(root: xml.etree.ElementTree.Element, path: pathlib.Path) -> None:
	"""Apply a positive element and attribute allowlist to one sheet."""
	for element in root.iter():
		tag = local_name(element.tag)
		if tag not in ALLOWED_ELEMENTS:
			raise ValueError(f"{path}: unsafe or unsupported SVG element: {tag}")
		for raw_name, value in element.attrib.items():
			name = local_name(raw_name)
			if name.startswith("data-aoc-"):
				continue
			if name not in ALLOWED_ATTRIBUTES:
				raise ValueError(f"{path}: unsafe or unsupported SVG attribute: {name}")
			if name.lower().startswith("on") or name == "style":
				raise ValueError(f"{path}: executable SVG attributes are not allowed: {name}")
			if "`" in value or "${" in value:
				raise ValueError(f"{path}: attribute cannot be represented safely in TSX: {name}")
		if element.text is not None and element.text.strip() and tag not in {"title", "desc", "text"}:
			raise ValueError(f"{path}: visible text is allowed only in text metadata elements")


#============================================
def validate_panel_positions(
	panels: tuple[xml.etree.ElementTree.Element, ...],
	frame_width: float,
	frame_height: float,
	path: pathlib.Path,
) -> None:
	"""Require the predictable side-by-side panel center convention."""
	for index, panel in enumerate(panels):
		transform = panel.attrib.get("transform", "")
		match = TRANSLATE_PATTERN.fullmatch(transform)
		if match is None:
			raise ValueError(f"{path}: panel transform must be one translate(x y)")
		x = float(match.group(1))
		y = float(match.group(2))
		expected_x = frame_width * (index + 0.5)
		expected_y = frame_height / 2
		if not math.isclose(x, expected_x) or not math.isclose(y, expected_y):
			raise ValueError(
				f"{path}: panel {index} must be centered at {expected_x:g},{expected_y:g}"
			)


#============================================
def validate_view_box(
	root: xml.etree.ElementTree.Element,
	frame_width: float,
	frame_height: float,
	panel_count: int,
	path: pathlib.Path,
) -> None:
	"""Require a sheet view box that exactly contains its panel row."""
	parts = root.attrib.get("viewBox", "").split()
	if len(parts) != 4:
		raise ValueError(f"{path}: viewBox must have four numbers")
	values = tuple(float(part) for part in parts)
	expected = (0.0, 0.0, frame_width * panel_count, frame_height)
	if any(not math.isclose(value, target) for value, target in zip(values, expected)):
		raise ValueError(f"{path}: viewBox must be 0 0 {expected[2]:g} {expected[3]:g}")


#============================================
def parse_sheet(path: pathlib.Path) -> VisualSheet:
	"""Parse and validate one authoring SVG without resolving external entities."""
	if path.stat().st_size > MAX_SHEET_BYTES:
		raise ValueError(f"{path}: SVG exceeds the {MAX_SHEET_BYTES}-byte resource limit")
	text = path.read_text(encoding="ascii")
	upper_text = text.upper()
	# ASVS 1.5.1: reject DTD and entity declarations before the restrictive stdlib parse.
	if "<!DOCTYPE" in upper_text or "<!ENTITY" in upper_text:
		raise ValueError(f"{path}: DTD and entity declarations are not allowed")
	root = xml.etree.ElementTree.fromstring(text)  # nosec B314 - DTD and entities rejected above.
	if local_name(root.tag) != "svg":
		raise ValueError(f"{path}: root element must be svg")
	# ASVS 2.2.1: validate every sheet against the closed authoring schema.
	validate_elements(root, path)
	kind = root.attrib.get("data-aoc-kind", "")
	key = root.attrib.get("data-aoc-key", "")
	if kind not in ALLOWED_CATALOG or KEY_PATTERN.fullmatch(key) is None:
		raise ValueError(f"{path}: invalid data-aoc-kind or data-aoc-key")
	frame_width = require_number(root.attrib.get("data-aoc-frame-width"), "frame width", path)
	frame_height = require_number(root.attrib.get("data-aoc-frame-height"), "frame height", path)
	panels = tuple(
		element
		for element in root
		if local_name(element.tag) == "g" and "data-aoc-panel" in element.attrib
	)
	if not panels:
		raise ValueError(f"{path}: at least one data-aoc-panel is required")
	panel_names = tuple(panel.attrib["data-aoc-panel"] for panel in panels)
	expected_panels = ALLOWED_CATALOG[kind].get(key)
	if expected_panels is None:
		raise ValueError(f"{path}: unexpected {kind} catalog key: {key}")
	if panel_names != expected_panels:
		raise ValueError(f"{path}: panels must be {', '.join(expected_panels)}")
	for panel in panels:
		parts = [element for element in panel.iter() if "data-aoc-part" in element.attrib]
		if not parts:
			raise ValueError(f"{path}: every panel needs at least one data-aoc-part group")
	validate_panel_positions(panels, frame_width, frame_height, path)
	validate_view_box(root, frame_width, frame_height, len(panels), path)
	ids = element_ids(root)
	validate_references(root, ids)
	sheet = VisualSheet(path, kind, key, frame_width, frame_height, root, panels)
	return sheet


#============================================
def validate_catalog(sheets: tuple[VisualSheet, ...]) -> None:
	"""Require core sheets and accept only approved authored world sheets."""
	found: dict[tuple[str, str], pathlib.Path] = {}
	for sheet in sheets:
		identity = (sheet.kind, sheet.key)
		if identity in found:
			raise ValueError(f"duplicate visual sheet identity: {sheet.kind}/{sheet.key}")
		found[identity] = sheet.path
	required = {
		(kind, key)
		for kind, catalog in EXPECTED_CATALOG.items()
		for key in catalog
	}
	allowed = {
		(kind, key)
		for kind, catalog in ALLOWED_CATALOG.items()
		for key in catalog
	}
	missing = sorted(required - set(found))
	# ASVS 2.2.1: the catalog boundary accepts only explicitly approved identities.
	extra = sorted(set(found) - allowed)
	if missing:
		labels = ", ".join(f"{kind}/{key}" for kind, key in missing)
		raise ValueError(f"missing visual sheets: {labels}")
	if extra:
		labels = ", ".join(f"{kind}/{key}" for kind, key in extra)
		raise ValueError(f"unexpected visual sheets: {labels}")


#============================================
def asset_token(sheet: VisualSheet) -> str:
	"""Return the stable runtime namespace token for one sheet."""
	token = f"{sheet.kind}-{sheet.key}".replace("_", "-")
	return token


#============================================
def component_name(*parts: str) -> str:
	"""Convert catalog keys into a stable generated PascalCase name."""
	words: list[str] = []
	for part in parts:
		words.extend(re.split(r"[-_]", part))
	name = "".join(word.capitalize() for word in words)
	return name


#============================================
def jsx_static_value(value: str) -> str:
	"""Encode an authored attribute as a double-quoted JSX value."""
	encoded = html.escape(value, quote=True)
	return f'"{encoded}"'


#============================================
def jsx_reference_value(value: str, token: str) -> str:
	"""Create a JSX template expression with namespaced local references."""
	if value.startswith("#") and ID_PATTERN.fullmatch(value[1:]) is not None:
		identifier = value[1:]
		return f'{{`#${{visualId(props.instanceKey, "{token}", "{identifier}")}}`}}'
	parts: list[str] = []
	position = 0
	for match in REFERENCE_PATTERN.finditer(value):
		parts.append(value[position : match.start()])
		identifier = match.group(1)
		parts.append(f'url(#${{visualId(props.instanceKey, "{token}", "{identifier}")}})')
		position = match.end()
	parts.append(value[position:])
	joined = "".join(parts)
	return f"{{`{joined}`}}"


#============================================
def jsx_attributes(
	element: xml.etree.ElementTree.Element,
	token: str,
	ignored: set[str] | None = None,
) -> str:
	"""Serialize safe XML attributes into deterministic JSX attributes."""
	ignored_names = ignored if ignored is not None else set()
	attributes: list[str] = []
	for raw_name, value in sorted(element.attrib.items(), key=lambda item: local_name(item[0])):
		name = local_name(raw_name)
		if name in ignored_names or name == "data-aoc-editor-only":
			continue
		if name == "id":
			encoded = f'{{visualId(props.instanceKey, "{token}", "{value}")}}'
		elif name == "href" or REFERENCE_PATTERN.search(value) is not None:
			encoded = jsx_reference_value(value, token)
		else:
			encoded = jsx_static_value(value)
		attributes.append(f"{name}={encoded}")
	return " ".join(attributes)


#============================================
def jsx_element(
	element: xml.etree.ElementTree.Element,
	token: str,
	indent: int,
) -> list[str]:
	"""Serialize one validated SVG subtree into formatted JSX lines."""
	if editor_only(element):
		return []
	tag = local_name(element.tag)
	padding = " " * indent
	attributes = jsx_attributes(element, token)
	opening = f"<{tag}"
	if attributes:
		opening += f" {attributes}"
	children = [child for child in element if not editor_only(child)]
	text = element.text.strip() if element.text is not None else ""
	if not children and not text:
		return [f"{padding}{opening} />"]
	lines = [f"{padding}{opening}>"]
	if text:
		lines.append(f"{padding}  {html.escape(text)}")
	for child in children:
		lines.extend(jsx_element(child, token, indent + 2))
	lines.append(f"{padding}</{tag}>")
	return lines


#============================================
def panel_function(sheet: VisualSheet, panel: xml.etree.ElementTree.Element) -> list[str]:
	"""Render one normalized authoring panel as a generated Solid component."""
	panel_name = panel.attrib["data-aoc-panel"]
	function_name = component_name(sheet.kind, sheet.key, panel_name)
	token = asset_token(sheet)
	view_box = (
		f"{-sheet.frame_width / 2:g} {-sheet.frame_height / 2:g} "
		f"{sheet.frame_width:g} {sheet.frame_height:g}"
	)
	lines = [
		f"function {function_name}(props: InstanceArtworkProps): JSX.Element {{",
		"  return (",
		f'    <g data-aoc-asset="{token}" data-aoc-panel="{panel_name}"',
		f'      data-aoc-view-box="{view_box}" data-instance-key={{props.instanceKey}}>',
	]
	for child in sheet.root:
		if local_name(child.tag) == "defs" and not editor_only(child):
			lines.extend(jsx_element(child, token, 6))
	for child in panel:
		lines.extend(jsx_element(child, token, 6))
	lines.extend(["    </g>", "  );", "}", ""])
	return lines


#============================================
def panel_renderer_map(sheet: VisualSheet, type_name: str) -> list[str]:
	"""Render a typed panel-to-component lookup for one multi-panel sheet."""
	constant_name = f"{component_name(sheet.kind, sheet.key).upper()}_PANELS"
	lines = [f"const {constant_name}: Record<{type_name}, ArtworkRenderer> = {{"]
	for index, panel in enumerate(sheet.panels):
		function_name = component_name(sheet.kind, sheet.key, panel.attrib["data-aoc-panel"])
		lines.append(f"  {index}: {function_name},")
	lines.extend(["};", ""])
	return lines


#============================================
def multi_panel_component(sheet: VisualSheet, type_name: str) -> list[str]:
	"""Render a private reactive component for an enemy or tower sheet."""
	name = component_name(sheet.kind, sheet.key)
	constant_name = f"{name.upper()}_PANELS"
	prop_name = "variant" if sheet.kind == "enemy" else "tier"
	lines = [
		(
			f"function {name}Artwork(props: {{ {prop_name}: {type_name}; "
			"instanceKey: string }): JSX.Element {"
		),
		f"  const renderer = (): ArtworkRenderer => {constant_name}[props.{prop_name}];",
		"  return <Dynamic component={renderer()} instanceKey={props.instanceKey} />;",
		"}",
		"",
	]
	return lines


#============================================
def render_enemy_and_tower_components(sheets: tuple[VisualSheet, ...]) -> list[str]:
	"""Render exhaustive public EnemyArtwork and TowerArtwork components."""
	lines: list[str] = []
	for kind, type_name in (("enemy", "VisualVariant"), ("tower", "VisualTier")):
		kind_sheets = [sheet for sheet in sheets if sheet.kind == kind]
		multi_sheets = [sheet for sheet in kind_sheets if len(sheet.panels) == 4]
		for sheet in multi_sheets:
			lines.extend(panel_renderer_map(sheet, type_name))
			lines.extend(multi_panel_component(sheet, type_name))
		catalog_type = "EnemyId" if kind == "enemy" else "TowerId"
		catalog_name = f"{kind.upper()}_VISUAL_CATALOG"
		lines.append(f"export const {catalog_name}: Record<{catalog_type}, readonly number[]> = {{")
		for sheet in kind_sheets:
			indices = ", ".join(str(index) for index in range(len(sheet.panels)))
			lines.append(f"  {sheet.key}: [{indices}],")
		lines.extend(["};", ""])
		renderer_name = f"{kind.upper()}_RENDERERS"
		props_name = "EnemyArtworkProps" if kind == "enemy" else "TowerArtworkProps"
		lines.append(f"const {renderer_name}: Record<{catalog_type}, {kind.capitalize()}Renderer> = {{")
		for sheet in kind_sheets:
			if len(sheet.panels) == 4:
				artwork_name = f"{component_name(sheet.kind, sheet.key)}Artwork"
				lines.append(f"  {sheet.key}: {artwork_name},")
			else:
				panel_name = component_name(
					sheet.kind,
					sheet.key,
					sheet.panels[0].attrib["data-aoc-panel"],
				)
				lines.append(f"  {sheet.key}: {panel_name},")
		lines.extend(["};", ""])
		public_name = f"{kind.capitalize()}Artwork"
		prop_name = "variant" if kind == "enemy" else "tier"
		lines.extend(
			[
				f"export function {public_name}(props: {props_name}): JSX.Element {{",
				f"  const renderer = (): {kind.capitalize()}Renderer => {renderer_name}[props.type];",
				(
					f"  return <g class=\"generated-{kind}-artwork\">"
					f"<Dynamic component={{renderer()}} {prop_name}={{props.{prop_name}}} instanceKey={{props.instanceKey}} />"
					+ "</g>;"
				),
				"}",
				"",
			]
		)
	return lines


#============================================
def render_single_catalog_component(
	sheets: tuple[VisualSheet, ...],
	kind: str,
	public_name: str,
	prop_type: str,
	key_expression: str,
) -> list[str]:
	"""Render an exhaustive single-panel public component."""
	kind_sheets = [sheet for sheet in sheets if sheet.kind == kind]
	constant_name = f"{kind.upper()}_RENDERERS"
	lines = [f"const {constant_name}: Record<{prop_type}, ArtworkRenderer> = {{"]
	for sheet in kind_sheets:
		if len(sheet.panels) != 1:
			continue
		function_name = component_name(sheet.kind, sheet.key, sheet.panels[0].attrib["data-aoc-panel"])
		key = sheet.key.removeprefix("attack_") if kind == "effect" else sheet.key
		lines.append(f"  {key}: {function_name},")
	lines.extend(
		[
			"};",
			"",
			(
				f"export function {public_name}(props: {{ type: {prop_type}; "
				"instanceKey: string }): JSX.Element {"
			),
			f"  const renderer = (): ArtworkRenderer => {constant_name}[{key_expression}];",
			"  return <Dynamic component={renderer()} instanceKey={props.instanceKey} />;",
			"}",
			"",
		]
	)
	return lines


#============================================
def render_death_components(sheets: tuple[VisualSheet, ...]) -> list[str]:
	"""Render apoptosis, rupture, and the non-lethal repair transition."""
	apoptosis = next(sheet for sheet in sheets if sheet.kind == "death" and sheet.key == "apoptosis")
	rupture = next(sheet for sheet in sheets if sheet.kind == "death" and sheet.key == "rupture")
	repair = next(sheet for sheet in sheets if sheet.kind == "transition" and sheet.key == "repair")
	lines = [
		"export function ApoptosisArtwork(props: ApoptosisArtworkProps): JSX.Element {",
		"  return (",
		"    <g class=\"apoptosis-artwork\" data-static-frame={props.frame}",
		"      data-instance-key={props.instanceKey}>",
	]
	for index, panel in enumerate(apoptosis.panels):
		function_name = component_name(apoptosis.kind, apoptosis.key, panel.attrib["data-aoc-panel"])
		lines.append(f'      <g class="apoptosis-frame apoptosis-frame-{index}">')
		lines.append(f"        <{function_name} instanceKey={{props.instanceKey}} />")
		lines.append("      </g>")
	lines.extend(["    </g>", "  );", "}", ""])
	rupture_name = component_name(
		rupture.kind,
		rupture.key,
		rupture.panels[0].attrib["data-aoc-panel"],
	)
	lines.extend(
		[
			"export function RuptureArtwork(props: InstanceArtworkProps): JSX.Element {",
			f"  return <{rupture_name} instanceKey={{props.instanceKey}} />;",
			"}",
			"",
		]
	)
	repair_name = component_name(
		repair.kind,
		repair.key,
		repair.panels[0].attrib["data-aoc-panel"],
	)
	lines.extend(
		[
			"export function RepairArtwork(props: InstanceArtworkProps): JSX.Element {",
			f"  return <{repair_name} instanceKey={{props.instanceKey}} />;",
			"}",
			"",
		]
	)
	return lines


#============================================
def world_artwork_id_type(sheets: tuple[VisualSheet, ...]) -> str:
	"""Return the generated union of every validated world artwork identity."""
	world_keys = sorted(sheet.key for sheet in sheets if sheet.kind == "world")
	return " | ".join(f'"{key}"' for key in world_keys)


#============================================
def render_typescript(sheets: tuple[VisualSheet, ...]) -> str:
	"""Render the complete deterministic generated TypeScript module."""
	world_artwork_ids = world_artwork_id_type(sheets)
	lines = [
		"// Generated by generate_visual_assets.py. Do not edit by hand.",
		'import type { JSX } from "solid-js";',
		'import { Dynamic } from "solid-js/web";',
		'import type { EnemyId, TowerId } from "../../src/game_types";',
		"",
		"export type VisualVariant = 0 | 1 | 2 | 3;",
		"export type VisualTier = 0 | 1 | 2 | 3;",
		"export type ApoptosisFrame = 0 | 1 | 2 | 3 | 4;",
		f"export type WorldArtworkId = {world_artwork_ids};",
		"",
		"export interface EnemyArtworkProps {",
		"  type: EnemyId;",
		"  variant: VisualVariant;",
		"  instanceKey: string;",
		"}",
		"",
		"export interface TowerArtworkProps {",
		"  type: TowerId;",
		"  tier: VisualTier;",
		"  instanceKey: string;",
		"}",
		"",
		"export interface ApoptosisArtworkProps {",
		"  instanceKey: string;",
		"  frame?: ApoptosisFrame;",
		"}",
		"",
		"interface InstanceArtworkProps {",
		"  instanceKey: string;",
		"}",
		"",
		"type ArtworkRenderer = (props: InstanceArtworkProps) => JSX.Element;",
		"type EnemyRenderer = (props: { variant: VisualVariant; instanceKey: string }) => JSX.Element;",
		"type TowerRenderer = (props: { tier: VisualTier; instanceKey: string }) => JSX.Element;",
		"",
		"function visualId(instanceKey: string, assetKey: string, localId: string): string {",
		'  const safeKey = instanceKey.replace(/[^A-Za-z0-9_-]/g, "-");',
		"  return `${safeKey}-${assetKey}-${localId}`;",
		"}",
		"",
	]
	for sheet in sheets:
		for panel in sheet.panels:
			lines.extend(panel_function(sheet, panel))
	lines.extend(render_enemy_and_tower_components(sheets))
	lines.extend(
		render_single_catalog_component(
			sheets,
			"effect",
			"AttackEffectArtwork",
			"TowerId",
			"props.type",
		)
	)
	lines.extend(
		render_single_catalog_component(
			sheets,
			"world",
			"WorldArtwork",
			"WorldArtworkId",
			"props.type",
		)
	)
	lines.extend(render_death_components(sheets))
	text = "\n".join(lines).rstrip() + "\n"
	return text


#============================================
def load_sheets(directory: pathlib.Path) -> tuple[VisualSheet, ...]:
	"""Load the complete catalog from one trusted directory."""
	# ASVS 5.3.2: use fixed repository-owned paths rather than authored filenames.
	paths = tuple(sorted(directory.glob("*.svg")))
	sheets = tuple(parse_sheet(path) for path in paths)
	validate_catalog(sheets)
	ordered = tuple(sorted(sheets, key=lambda sheet: (sheet.kind, sheet.key)))
	return ordered


#============================================
def generate_catalog(directory: pathlib.Path = SHEETS_DIR) -> str:
	"""Validate a directory and return its deterministic TSX output."""
	sheets = load_sheets(directory)
	text = render_typescript(sheets)
	return text


#============================================
def write_catalog_atomically(text: str) -> None:
	"""Replace generated output only after its complete ASCII content is ready."""
	# ASVS 5.3.2: OUTPUT_FILE is a fixed repository-owned destination, never an SVG filename.
	OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
	with tempfile.NamedTemporaryFile(
		mode="w",
		encoding="ascii",
		dir=OUTPUT_FILE.parent,
		prefix=f".{OUTPUT_FILE.name}.",
		suffix=".tmp",
		delete=False,
	) as temporary_file:
		temporary_file.write(text)
		temporary_file.flush()
		os.fsync(temporary_file.fileno())
		temporary_path = pathlib.Path(temporary_file.name)
	try:
		os.replace(temporary_path, OUTPUT_FILE)
	finally:
		if temporary_path.exists():
			temporary_path.unlink()


#============================================
def main() -> None:
	"""Generate the ignored SolidJS visual component catalog."""
	if sys.version_info[:2] != (3, 12):
		raise RuntimeError("generate_visual_assets.py requires Python 3.12")
	sheets = load_sheets(SHEETS_DIR)
	text = render_typescript(sheets)
	write_catalog_atomically(text)
	print(f"Generated {OUTPUT_FILE.relative_to(REPO_ROOT)} from {len(sheets)} sheets.")


if __name__ == "__main__":
	main()
