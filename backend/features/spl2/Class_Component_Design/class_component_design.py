import ast
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field


@dataclass
class ClassInfo:
    class_id: str
    class_name: str
    language: str
    file_path: str
    bases: list[str] = field(default_factory=list)
    fields: set[str] = field(default_factory=set)
    method_fields: dict[str, set[str]] = field(default_factory=dict)
    method_complexities: dict[str, int] = field(default_factory=dict)


class ClassComponentDesign:
    """Computes class/component design metrics for Python, Java and C++."""

    _LANG_EXTENSIONS = {
        "python": {".py"},
        "java": {".java"},
        "cpp": {".cpp", ".cc", ".cxx", ".hpp", ".h"},
    }

    def get_metrics(self, github_url: str, language: str | None = None) -> dict:
        selected_language = (language or "all").strip().lower()
        if selected_language not in {"all", "python", "java", "cpp"}:
            raise ValueError("language must be one of: all, python, java, cpp")

        clone_dir = tempfile.mkdtemp(prefix="devlens_class_design_")
        try:
            result = subprocess.run(
                ["git", "clone", "--quiet", github_url, clone_dir],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode != 0:
                raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

            classes = self._analyze_repository(clone_dir, selected_language)
            if not classes:
                return {
                    "githubUrl": github_url,
                    "summary": {
                        "totalClasses": 0,
                        "languages": {"python": 0, "java": 0, "cpp": 0},
                        "averageWMC": 0,
                        "averageLCOM": 0,
                        "maxDIT": 0,
                        "maxNOC": 0,
                    },
                    "classes": [],
                }

            noc_map, dit_map = self._build_inheritance_metrics(classes)
            class_rows = []
            for cls in classes:
                wmc = sum(cls.method_complexities.values())
                lcom = self._compute_lcom(cls.method_fields)
                dit = dit_map.get(cls.class_id, 0)
                noc = noc_map.get(cls.class_id, 0)
                class_rows.append(
                    {
                        "className": cls.class_name,
                        "language": cls.language,
                        "filePath": cls.file_path,
                        "bases": cls.bases,
                        "methodCount": len(cls.method_complexities),
                        "fieldCount": len(cls.fields),
                        "metrics": {
                            "WMC": wmc,
                            "LCOM": lcom,
                            "DIT": dit,
                            "NOC": noc,
                        },
                    }
                )

            class_rows.sort(
                key=lambda item: (
                    item["language"],
                    -item["metrics"]["WMC"],
                    item["className"],
                )
            )

            total_classes = len(class_rows)
            lang_counts = {
                "python": sum(1 for c in classes if c.language == "python"),
                "java": sum(1 for c in classes if c.language == "java"),
                "cpp": sum(1 for c in classes if c.language == "cpp"),
            }

            return {
                "githubUrl": github_url,
                "summary": {
                    "totalClasses": total_classes,
                    "languages": lang_counts,
                    "averageWMC": round(sum(c["metrics"]["WMC"] for c in class_rows) / total_classes, 2),
                    "averageLCOM": round(sum(c["metrics"]["LCOM"] for c in class_rows) / total_classes, 2),
                    "maxDIT": max(c["metrics"]["DIT"] for c in class_rows),
                    "maxNOC": max(c["metrics"]["NOC"] for c in class_rows),
                },
                "classes": class_rows,
            }
        finally:
            shutil.rmtree(clone_dir, ignore_errors=True)

    def _analyze_repository(self, repo_root: str, selected_language: str) -> list[ClassInfo]:
        classes: list[ClassInfo] = []
        for root, dirs, files in os.walk(repo_root):
            dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "dist", "build"}]
            for filename in files:
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, repo_root)
                extension = os.path.splitext(filename)[1].lower()
                lang = self._language_for_extension(extension)
                if not lang:
                    continue
                if selected_language != "all" and selected_language != lang:
                    continue

                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as source_file:
                        content = source_file.read()
                except OSError:
                    continue

                if lang == "python":
                    classes.extend(self._parse_python_classes(content, relative_path))
                elif lang == "java":
                    classes.extend(self._parse_java_classes(content, relative_path))
                elif lang == "cpp":
                    classes.extend(self._parse_cpp_classes(content, relative_path))

        return classes

    def _language_for_extension(self, extension: str) -> str | None:
        for language, extensions in self._LANG_EXTENSIONS.items():
            if extension in extensions:
                return language
        return None

    def _parse_python_classes(self, content: str, file_path: str) -> list[ClassInfo]:
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return []

        classes: list[ClassInfo] = []
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
                continue

            class_id = f"python:{file_path}:{node.name}"
            bases = [self._python_node_name(base) for base in node.bases if self._python_node_name(base)]
            class_fields: set[str] = set()
            method_fields: dict[str, set[str]] = {}
            method_complexities: dict[str, int] = {}

            for item in node.body:
                if isinstance(item, ast.Assign):
                    for target in item.targets:
                        if isinstance(target, ast.Name):
                            class_fields.add(target.id)
                elif isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    class_fields.add(item.target.id)
                elif isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    method_name = item.name
                    fields_in_method = self._python_fields_in_function(item)
                    complexity = self._python_method_complexity(item)
                    method_fields[method_name] = fields_in_method
                    method_complexities[method_name] = complexity
                    class_fields.update(fields_in_method)

            classes.append(
                ClassInfo(
                    class_id=class_id,
                    class_name=node.name,
                    language="python",
                    file_path=file_path,
                    bases=bases,
                    fields=class_fields,
                    method_fields=method_fields,
                    method_complexities=method_complexities,
                )
            )

        return classes

    def _python_node_name(self, node: ast.AST) -> str:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            value = self._python_node_name(node.value)
            if value:
                return f"{value}.{node.attr}"
            return node.attr
        return ""

    def _python_fields_in_function(self, function_node: ast.AST) -> set[str]:
        fields = set()
        for child in ast.walk(function_node):
            if isinstance(child, ast.Attribute):
                if isinstance(child.value, ast.Name) and child.value.id == "self":
                    fields.add(child.attr)
            elif isinstance(child, ast.Assign):
                for target in child.targets:
                    if isinstance(target, ast.Attribute):
                        if isinstance(target.value, ast.Name) and target.value.id == "self":
                            fields.add(target.attr)
            elif isinstance(child, ast.AnnAssign) and isinstance(child.target, ast.Attribute):
                if isinstance(child.target.value, ast.Name) and child.target.value.id == "self":
                    fields.add(child.target.attr)
        return fields

    def _python_method_complexity(self, function_node: ast.AST) -> int:
        complexity = 1
        for child in ast.walk(function_node):
            if isinstance(
                child,
                (
                    ast.If,
                    ast.For,
                    ast.AsyncFor,
                    ast.While,
                    ast.Try,
                    ast.ExceptHandler,
                    ast.BoolOp,
                    ast.IfExp,
                    ast.comprehension,
                    ast.Match,
                ),
            ):
                complexity += 1
        return complexity

    def _parse_java_classes(self, content: str, file_path: str) -> list[ClassInfo]:
        stripped = self._strip_comments(content)
        class_pattern = re.compile(r"\bclass\s+(\w+)(?:\s+extends\s+(\w+))?[^\{]*\{", re.MULTILINE)

        classes: list[ClassInfo] = []
        for class_match in class_pattern.finditer(stripped):
            class_name = class_match.group(1)
            base = class_match.group(2)
            open_brace_index = class_match.end() - 1
            close_brace_index = self._find_matching_brace(stripped, open_brace_index)
            if close_brace_index == -1:
                continue

            class_body = stripped[open_brace_index + 1 : close_brace_index]
            class_id = f"java:{file_path}:{class_name}"
            fields = self._extract_java_fields(class_body)
            method_fields, method_complexities = self._extract_java_methods(class_name, class_body, fields)

            classes.append(
                ClassInfo(
                    class_id=class_id,
                    class_name=class_name,
                    language="java",
                    file_path=file_path,
                    bases=[base] if base else [],
                    fields=fields,
                    method_fields=method_fields,
                    method_complexities=method_complexities,
                )
            )

        return classes

    def _extract_java_fields(self, class_body: str) -> set[str]:
        fields: set[str] = set()
        field_pattern = re.compile(
            r"(?:public|private|protected|static|final|transient|volatile|\s)+[\w<>\[\], ?]+\s+(\w+)\s*(?:=[^;]*)?;"
        )
        for match in field_pattern.finditer(class_body):
            declaration = match.group(0)
            if "(" in declaration or ")" in declaration:
                continue
            fields.add(match.group(1))
        return fields

    def _extract_java_methods(
        self,
        class_name: str,
        class_body: str,
        class_fields: set[str],
    ) -> tuple[dict[str, set[str]], dict[str, int]]:
        method_fields: dict[str, set[str]] = {}
        method_complexities: dict[str, int] = {}

        method_pattern = re.compile(
            r"(?:public|private|protected|static|final|synchronized|abstract|native|\s)+"
            r"[\w<>\[\], ?]+\s+(\w+)\s*\([^;{}]*\)\s*(?:throws[^{]+)?\{"
        )
        constructor_pattern = re.compile(
            rf"(?:public|private|protected|\s)+({re.escape(class_name)})\s*\([^;{{}}]*\)\s*(?:throws[^{{]+)?\{{"
        )

        for match in list(method_pattern.finditer(class_body)) + list(constructor_pattern.finditer(class_body)):
            method_name = match.group(1)
            open_brace_index = match.end() - 1
            close_brace_index = self._find_matching_brace(class_body, open_brace_index)
            if close_brace_index == -1:
                continue

            method_body = class_body[open_brace_index + 1 : close_brace_index]
            method_fields[method_name] = self._infer_fields_from_body(method_body, class_fields, pointer_op="this.")
            method_complexities[method_name] = self._generic_cyclomatic_complexity(method_body)

        return method_fields, method_complexities

    def _parse_cpp_classes(self, content: str, file_path: str) -> list[ClassInfo]:
        stripped = self._strip_comments(content)
        class_pattern = re.compile(r"\b(class|struct)\s+(\w+)(?:\s*:\s*([^\{]+))?\s*\{", re.MULTILINE)

        classes: list[ClassInfo] = []
        for class_match in class_pattern.finditer(stripped):
            class_name = class_match.group(2)
            bases_spec = class_match.group(3)
            open_brace_index = class_match.end() - 1
            close_brace_index = self._find_matching_brace(stripped, open_brace_index)
            if close_brace_index == -1:
                continue

            class_body = stripped[open_brace_index + 1 : close_brace_index]
            class_id = f"cpp:{file_path}:{class_name}"
            bases = self._parse_cpp_bases(bases_spec)
            fields = self._extract_cpp_fields(class_body)
            method_fields, method_complexities = self._extract_cpp_methods(class_name, class_body, fields)

            classes.append(
                ClassInfo(
                    class_id=class_id,
                    class_name=class_name,
                    language="cpp",
                    file_path=file_path,
                    bases=bases,
                    fields=fields,
                    method_fields=method_fields,
                    method_complexities=method_complexities,
                )
            )

        return classes

    def _parse_cpp_bases(self, bases_spec: str | None) -> list[str]:
        if not bases_spec:
            return []

        bases: list[str] = []
        parts = [part.strip() for part in bases_spec.split(",")]
        for part in parts:
            cleaned = re.sub(r"\b(public|protected|private|virtual)\b", "", part).strip()
            tokens = re.findall(r"[A-Za-z_]\w*", cleaned)
            if tokens:
                bases.append(tokens[-1])
        return bases

    def _extract_cpp_fields(self, class_body: str) -> set[str]:
        fields: set[str] = set()
        field_pattern = re.compile(r"(?:[\w:<>~\*&]+\s+)+(\w+)\s*(?:=[^;]*)?;")

        for match in field_pattern.finditer(class_body):
            declaration = match.group(0).strip()
            if declaration in {"public:", "private:", "protected:"}:
                continue
            if "(" in declaration or ")" in declaration:
                continue
            fields.add(match.group(1))

        return fields

    def _extract_cpp_methods(
        self,
        class_name: str,
        class_body: str,
        class_fields: set[str],
    ) -> tuple[dict[str, set[str]], dict[str, int]]:
        method_fields: dict[str, set[str]] = {}
        method_complexities: dict[str, int] = {}

        method_pattern = re.compile(
            r"(?:virtual\s+)?(?:[\w:<>~\*&]+\s+)*(~?\w+)\s*\([^;{}]*\)\s*(?:const\s*)?(?:override\s*)?(?:final\s*)?(?:=\s*0\s*)?(\{|;)"
        )

        for match in method_pattern.finditer(class_body):
            method_name = match.group(1)
            terminator = match.group(2)
            if method_name in {"if", "for", "while", "switch", "catch"}:
                continue

            if terminator == ";":
                method_fields[method_name] = set()
                method_complexities[method_name] = 1
                continue

            open_brace_index = match.end() - 1
            close_brace_index = self._find_matching_brace(class_body, open_brace_index)
            if close_brace_index == -1:
                continue

            method_body = class_body[open_brace_index + 1 : close_brace_index]
            method_fields[method_name] = self._infer_fields_from_body(method_body, class_fields, pointer_op="this->")
            method_complexities[method_name] = self._generic_cyclomatic_complexity(method_body)

        if class_name not in method_complexities:
            constructor_pattern = re.compile(rf"\b{re.escape(class_name)}\s*\([^;{{}}]*\)\s*\{{")
            for match in constructor_pattern.finditer(class_body):
                open_brace_index = match.end() - 1
                close_brace_index = self._find_matching_brace(class_body, open_brace_index)
                if close_brace_index == -1:
                    continue
                method_body = class_body[open_brace_index + 1 : close_brace_index]
                method_fields[class_name] = self._infer_fields_from_body(method_body, class_fields, pointer_op="this->")
                method_complexities[class_name] = self._generic_cyclomatic_complexity(method_body)

        return method_fields, method_complexities

    def _strip_comments(self, content: str) -> str:
        no_block = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
        no_line_cpp = re.sub(r"//.*", "", no_block)
        no_line_hash = re.sub(r"#.*", "", no_line_cpp)
        return no_line_hash

    def _find_matching_brace(self, text: str, open_index: int) -> int:
        depth = 0
        for index in range(open_index, len(text)):
            if text[index] == "{":
                depth += 1
            elif text[index] == "}":
                depth -= 1
                if depth == 0:
                    return index
        return -1

    def _infer_fields_from_body(self, method_body: str, class_fields: set[str], pointer_op: str) -> set[str]:
        usage = set(re.findall(rf"\b{re.escape(pointer_op)}\s*(\w+)", method_body))
        for field_name in class_fields:
            if re.search(rf"\b{re.escape(field_name)}\b", method_body):
                usage.add(field_name)
        return usage

    def _generic_cyclomatic_complexity(self, method_body: str) -> int:
        keyword_count = 0
        for keyword in ["if", "for", "while", "case", "catch", "&&", "||", "?", "elif", "except", "and", "or"]:
            if keyword in {"&&", "||", "?"}:
                keyword_count += method_body.count(keyword)
            else:
                keyword_count += len(re.findall(rf"\b{keyword}\b", method_body))
        return max(1, 1 + keyword_count)

    def _build_inheritance_metrics(self, classes: list[ClassInfo]) -> tuple[dict[str, int], dict[str, int]]:
        classes_by_id = {cls.class_id: cls for cls in classes}
        by_lang_and_name: dict[tuple[str, str], list[str]] = {}

        for cls in classes:
            by_lang_and_name.setdefault((cls.language, cls.class_name), []).append(cls.class_id)

        parent_map: dict[str, set[str]] = {cls.class_id: set() for cls in classes}
        child_map: dict[str, set[str]] = {cls.class_id: set() for cls in classes}

        for cls in classes:
            for base in cls.bases:
                key = (cls.language, base.split(".")[-1])
                candidates = by_lang_and_name.get(key, [])
                if not candidates:
                    continue
                parent_id = sorted(candidates)[0]
                parent_map[cls.class_id].add(parent_id)
                child_map[parent_id].add(cls.class_id)

        noc_map = {class_id: len(children) for class_id, children in child_map.items()}

        depth_cache: dict[str, int] = {}

        def compute_depth(class_id: str, visiting: set[str]) -> int:
            if class_id in depth_cache:
                return depth_cache[class_id]
            if class_id in visiting:
                return 0

            parents = parent_map.get(class_id, set())
            if not parents:
                depth_cache[class_id] = 0
                return 0

            visiting.add(class_id)
            depth_cache[class_id] = 1 + max(compute_depth(parent_id, visiting) for parent_id in parents)
            visiting.remove(class_id)
            return depth_cache[class_id]

        dit_map = {class_id: compute_depth(class_id, set()) for class_id in classes_by_id.keys()}
        return noc_map, dit_map

    def _compute_lcom(self, method_fields: dict[str, set[str]]) -> int:
        methods = list(method_fields.keys())
        method_count = len(methods)
        if method_count <= 1:
            return 0

        disjoint_pairs = 0
        joint_pairs = 0

        for i in range(method_count):
            for j in range(i + 1, method_count):
                first_fields = method_fields.get(methods[i], set())
                second_fields = method_fields.get(methods[j], set())
                if first_fields.intersection(second_fields):
                    joint_pairs += 1
                else:
                    disjoint_pairs += 1

        return max(disjoint_pairs - joint_pairs, 0)
