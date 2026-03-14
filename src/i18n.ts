type PatternTranslator = {
    pattern: RegExp;
    translate: (match: RegExpExecArray) => string;
};

const EXACT_TRANSLATIONS: Record<string, string> = {
    "JSON-UI Builder": "JSON-UI 메이커",
    "Import Textures": "텍스처 불러오기",
    "Upload Form": "폼 업로드",
    "Import UI Folder": "UI 폴더 불러오기",
    "Paste Form Code": "폼 코드 붙여넣기",
    "Glyph Editor": "글리프 편집기",
    "Not signed in": "로그인되지 않음",
    "Sign In": "로그인",
    "Sign Up": "회원가입",
    "Logout": "로그아웃",
    "Upload Preset": "프리셋 업로드",
    "Manage Presets": "프리셋 관리",
    "Preset Textures": "프리셋 텍스처",
    "Settings": "설정",
    "Scale:": "배율:",
    "??Undo": "되돌리기",
    "??Redo": "다시 실행",
    "Undo (Ctrl+Z)": "되돌리기 (Ctrl+Z)",
    "Redo (Ctrl+Y)": "다시 실행 (Ctrl+Y)",
    "Help": "도움말",
    "Add Button": "버튼 추가",
    "Create Form": "폼 만들기",
    "Save Forms": "폼 저장",
    "Load Texture Presets": "텍스처 프리셋 불러오기",
    "Key Binds:": "단축키:",
    "Copy": "복사",
    "Paste": "붙여넣기",
    "Cut": "잘라내기",
    "Indent": "들여쓰기",
    "Delete": "삭제",
    "Autocomplete": "자동완성",
    "Move": "이동",
    "General Issues:": "자주 있는 문제:",
    "Why arent my buttons working in-game?": "게임 안에서 버튼이 왜 작동하지 않나요?",
    "You probably need to stack the button on top of a collection panel, if that doesnt fix it, check that all texture paths are correct":
        "버튼을 collection panel 위에 올려야 할 가능성이 큽니다. 그래도 안 되면 텍스처 경로가 모두 올바른지 확인해 주세요.",
    "Why isnt the form uploader working?": "폼 업로더가 왜 작동하지 않나요?",
    "The form uploader can only upload forms made by the website": "폼 업로더는 이 사이트에서 만든 폼만 불러올 수 있습니다.",
    "Choose Image": "이미지 선택",
    ": Nineslice Image": ": 나인슬라이스 이미지",
    "Nineslice Image": "나인슬라이스 이미지",
    "Elements:": "요소:",
    "Add panel": "패널 추가",
    "Add image": "이미지 추가",
    "Add button": "버튼 추가",
    "Add Collection Panel": "컬렉션 패널 추가",
    "Add Label": "라벨 추가",
    "Add Scrolling Panel": "스크롤 패널 추가",
    "Reset": "초기화",
    "Delete Selected": "선택 항목 삭제",
    "Form": "폼",
    "Server-Form": "서버 폼",
    "Script": "스크립트",
    "For Fixed Collection Index Forms Only": "고정 컬렉션 인덱스 폼 전용",
    "Bindings": "바인딩",
    "Advanced Feature": "고급 기능",
    "Warnings 주의": "경고 주의",
    "Default Error Message": "기본 오류 메시지",
    "To Clipboard": "클립보드로",
    "Format": "정리",
    "To indent": "들여쓰기",
    "Background": "배경",
    "JavaScript": "자바스크립트",
    "TypeScript": "타입스크립트",
    "Width": "너비",
    "Height": "높이",
    "Left": "왼쪽",
    "Top": "위쪽",
    "Layer": "레이어",
    "Fill Parent": "부모에 맞춤",
    "Texture": "텍스처",
    "Default Texture": "기본 텍스처",
    "Hover Texture": "호버 텍스처",
    "Pressed Texture": "눌림 텍스처",
    "Collection Index": "컬렉션 인덱스",
    "Display Texture": "표시 텍스처",
    "Collection Name": "컬렉션 이름",
    "Font Scale": "글자 크기",
    "Text Align": "텍스트 정렬",
    "Font Family": "글꼴",
    "Shadow": "그림자",
    "Boundary Constraints": "경계 제한",
    "Arrow Key Move Amount": "방향키 이동량",
    "Grid Lock Rows": "그리드 고정 행",
    "Grid Lock Columns": "그리드 고정 열",
    "Grid Lock Radius": "그리드 고정 반경",
    "Grid Lock": "그리드 고정",
    "Show Grid": "그리드 표시",
    "Element Outline": "요소 외곽선",
    "Selected Element Children Get Copied": "선택 요소 자식도 복사",
    "Title Flag": "타이틀 플래그",
    "Editable": "수정 가능",
    "Not Editable": "수정 불가",
    "Create": "생성",
    "Will be set as your title flag in scripts": "스크립트에서 title_flag로 사용됩니다.",
    "Cant start with a number": "숫자로 시작할 수 없습니다",
    "Search images...": "이미지 검색...",
    "To get the textures in MC": "MC 텍스처를 얻으려면",
    "download the files from github": "GitHub에서 파일을 내려받으세요",
    "Sign in to upload and view your presets": "로그인하면 프리셋을 업로드하고 확인할 수 있습니다",
    "Turquoise Ore-UI Style": "청록 Ore-UI 스타일",
    "Red Ore-UI Style": "빨강 Ore-UI 스타일",
    "Pink Ore-UI Style": "핑크 Ore-UI 스타일",
    "Eternal Ore-UI Style": "이터널 Ore-UI 스타일",
    "Other Ore-UI Style": "기타 Ore-UI 스타일",
    "Load Textures": "텍스처 불러오기",
    "Your Uploaded Presets": "내 업로드 프리셋",
    "No presets available. Upload some presets first!": "사용 가능한 프리셋이 없습니다. 먼저 프리셋을 업로드해 주세요.",
    "Your Presets": "내 프리셋",
    "(Public)": "(공개)",
    "(Private)": "(비공개)",
    "Public Presets": "공개 프리셋",
    "Error loading presets": "프리셋을 불러오는 중 오류가 발생했습니다",
    "Loading presets...": "프리셋 불러오는 중...",
    "Public": "공개",
    "Private": "비공개",
    "Edit Name": "이름 수정",
    "Make Private": "비공개로 변경",
    "Make Public": "공개로 변경",
    "Save": "저장",
    "Cancel": "취소",
    "Upload PNG textures and their corresponding nineslice JSON files.": "PNG 텍스처와 대응되는 나인슬라이스 JSON 파일을 업로드하세요.",
    "Note:": "참고:",
    "mappings.json files are not allowed.": "mappings.json 파일은 허용되지 않습니다.",
    "Preset Name:": "프리셋 이름:",
    "Enter a name for your preset": "프리셋 이름을 입력해 주세요",
    "Select PNG and JSON files:": "PNG와 JSON 파일 선택:",
    "You can select multiple PNG files and their corresponding JSON files": "여러 PNG 파일과 대응 JSON 파일을 함께 선택할 수 있습니다.",
    "Make this preset public": "이 프리셋을 공개로 설정",
    "Public presets can be seen and used by other users": "공개 프리셋은 다른 사용자도 보고 사용할 수 있습니다.",
    "Uploading...": "업로드 중...",
    "Username:": "사용자 이름:",
    "Password:": "비밀번호:",
    "Need an account? Sign Up": "계정이 없나요? 회원가입",
    "Already have an account? Sign In": "이미 계정이 있나요? 로그인",
    "Please enter a name for your preset": "프리셋 이름을 입력해 주세요.",
    "Please select files to upload": "업로드할 파일을 선택해 주세요.",
    "An unexpected error occurred during upload": "업로드 중 예상치 못한 오류가 발생했습니다.",
    "An unexpected error occurred": "예상치 못한 오류가 발생했습니다.",
    "Copied Element": "요소가 복사되었습니다.",
    "Server-Form Copied to Clipboard!": "서버 폼이 클립보드에 복사되었습니다!",
    "Json-UI Copied to Clipboard!": "JSON-UI가 클립보드에 복사되었습니다!",
    "Cannot stack scrolling panels": "스크롤 패널은 중첩할 수 없습니다.",
    "Please upload a texture for the default state!": "기본 상태 텍스처를 업로드해 주세요!",
    "Please upload a texture for the hover state!": "호버 상태 텍스처를 업로드해 주세요!",
    "Please upload a texture for the pressed state!": "눌림 상태 텍스처를 업로드해 주세요!",
    "You must be signed in to upload presets": "프리셋을 업로드하려면 로그인해야 합니다.",
    "You must be signed in to manage presets": "프리셋을 관리하려면 로그인해야 합니다.",
    "Signed out successfully": "로그아웃되었습니다.",
    "Invalid namespace, please upload a valid form": "유효하지 않은 namespace입니다. 올바른 폼을 업로드해 주세요.",
    "Cant find root element, please upload a valid form": "루트 요소를 찾을 수 없습니다. 올바른 폼을 업로드해 주세요.",
    "Form uploaded successfully": "폼을 업로드했습니다.",
    "Some elements lack a type": "일부 요소에 type이 없습니다.",
    "Error creating element": "요소를 생성하는 중 오류가 발생했습니다.",
    "Error following path, namespace error": "경로를 따라가는 중 namespace 오류가 발생했습니다.",
    "Error following path": "경로를 따라가는 중 오류가 발생했습니다.",
    "Collection name not found": "컬렉션 이름을 찾을 수 없습니다.",
    "Error pasting element": "요소를 붙여넣는 중 오류가 발생했습니다.",
    "Image path not found": "이미지 경로를 찾을 수 없습니다.",
    "Display-Image path not found": "표시 이미지 경로를 찾을 수 없습니다.",
    "Default-Image path not found": "기본 이미지 경로를 찾을 수 없습니다.",
    "Hover-Image path not found": "호버 이미지 경로를 찾을 수 없습니다.",
    "Pressed-Image path not found": "눌림 이미지 경로를 찾을 수 없습니다.",
    "Selected element cannot have children": "선택한 요소에는 자식을 추가할 수 없습니다.",
    "Element pasted": "요소를 붙여넣었습니다.",
    "No operations to undo": "되돌릴 작업이 없습니다.",
    "Undid last change": "마지막 변경을 되돌렸습니다.",
    "No operations to redo": "다시 실행할 작업이 없습니다.",
    "Redid last change": "마지막 변경을 다시 실행했습니다.",
    "TS Copied to Clipboard!": "TS 코드가 클립보드에 복사되었습니다!",
    "JS Copied to Clipboard!": "JS 코드가 클립보드에 복사되었습니다!",
    "Preset name cannot be empty": "프리셋 이름은 비워둘 수 없습니다.",
    "Preset name updated successfully": "프리셋 이름을 수정했습니다.",
    "Failed to update preset name": "프리셋 이름 수정에 실패했습니다.",
    "Failed to change preset visibility": "프리셋 공개 상태 변경에 실패했습니다.",
    "Preset deleted successfully": "프리셋을 삭제했습니다.",
    "Database manager not available": "데이터베이스 관리자를 사용할 수 없습니다.",
    "Failed to delete preset": "프리셋 삭제에 실패했습니다.",
    "Are you sure you want to delete this preset? This action cannot be undone.": "이 프리셋을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    "No display image or display text found for button": "버튼에 표시 이미지나 표시 텍스트가 없습니다.",
    "Invalid JSON. Check commas, quotes, and brackets.": "유효하지 않은 JSON입니다. 쉼표, 따옴표, 괄호를 확인해 주세요.",
    "Username and password are required": "사용자 이름과 비밀번호를 입력해 주세요.",
    "Username must be at least 3 characters": "사용자 이름은 3자 이상이어야 합니다.",
    "Password must be at least 6 characters": "비밀번호는 6자 이상이어야 합니다.",
    "Username already exists": "이미 존재하는 사용자 이름입니다.",
    "Account created successfully": "계정을 만들었습니다.",
    "Failed to create account": "계정 생성에 실패했습니다.",
    "Signed in successfully": "로그인되었습니다.",
    "Invalid username or password": "사용자 이름 또는 비밀번호가 올바르지 않습니다.",
    "Failed to sign in": "로그인에 실패했습니다.",
    "You must be signed in": "로그인해야 합니다.",
    "Preset not found or access denied": "프리셋을 찾을 수 없거나 접근 권한이 없습니다.",
    "Failed to update preset visibility": "프리셋 공개 상태 업데이트에 실패했습니다.",
    "Failed to create preset": "프리셋 생성에 실패했습니다.",
    "Preset must include at least one PNG or nineslice JSON file (mappings.json excluded)": "프리셋에는 최소 하나의 PNG 또는 나인슬라이스 JSON 파일이 있어야 합니다. (mappings.json 제외)",
    "Close Preview": "미리보기 닫기",
    "PNG texture loaded": "PNG 텍스처를 불러왔습니다.",
    "NineSlice configuration found": "나인슬라이스 설정을 찾았습니다.",
    "Size:": "크기:",
    "Base Size:": "기본 크기:",
    "Panel": "패널",
    "Image": "이미지",
    "Button": "버튼",
    "Collection Panel": "컬렉션 패널",
    "Label": "라벨",
    "Scrolling Panel": "스크롤 패널",
    "Bindings Quick Guide": "바인딩 빠른 설명",
    '1. Use "binding_name" to receive a value such as "#title_text".': '1. "binding_name"은 "#title_text" 같은 값을 받을 때 사용합니다.',
    '2. Use "binding_type": "view" when you want to control visibility or other view properties.': '2. 표시 여부나 다른 뷰 속성을 제어할 때는 "binding_type": "view"를 사용합니다.',
    '"source_property_name" is the condition or source expression, and "target_property_name" is the property to change.': '"source_property_name"은 조건 또는 원본 표현식이고, "target_property_name"은 실제로 바꿀 속성입니다.',
    'Tips: Type # for source property suggestions, and type " inside a key to see available binding keys.': '팁: #을 입력하면 source property 후보가 나오고, 키 이름 안에서 "를 입력하면 사용 가능한 binding key 후보가 나옵니다.',
    "Example:": "예시:",
    "Form Name": "폼 이름",
    "Namespace": "네임스페이스",
    "Used for the exported file name and namespace": "내보내는 파일 이름과 namespace에 사용됩니다.",
    "Adjust the form name before copying or downloading.": "복사하거나 다운로드하기 전에 폼 이름을 조정해 주세요.",
    "This updates the exported file name and namespace together.": "내보내는 파일 이름과 namespace가 함께 변경됩니다.",
    "This updates the form file name and namespace together. Server-Form stays server_form.json.": "폼 파일 이름과 namespace만 함께 변경됩니다. 서버 폼은 항상 server_form.json을 유지합니다.",
    "Copy or download the standard form JSON.": "일반 폼 JSON을 복사하거나 다운로드합니다.",
    "Copy or download the server form that points to this form.": "이 폼을 참조하는 서버 폼을 복사하거나 다운로드합니다.",
    "Download": "다운로드",
    "Please enter a form name.": "폼 이름을 입력해 주세요.",
    "Use This Texture": "이 텍스처 사용",
    "External Resources": "외부 리소스",
    "Load a GitHub repository, search its images, preview them, then import them into this builder.": "GitHub 저장소를 불러와 이미지를 검색하고 미리본 뒤 이 빌더로 가져올 수 있습니다.",
    "Load Repo": "리포 불러오기",
    "Open GitResource": "GitResource 열기",
    "Load a repository to browse external images.": "외부 이미지를 보려면 먼저 리포를 불러오세요.",
    "Search external images...": "외부 이미지 검색...",
    "No external images loaded yet.": "아직 불러온 외부 이미지가 없습니다.",
    "No external images matched your search.": "검색 결과에 맞는 외부 이미지가 없습니다.",
    "Preview": "미리보기",
    "Import & Use": "가져와서 사용",
    "Loading external resources...": "외부 리소스를 불러오는 중...",
    "License info was not provided. Only import resources you have permission to use.": "라이선스 정보가 없습니다. 사용 허가를 확인한 리소스만 가져오세요.",
    "Could not load the external texture.": "외부 텍스처를 불러오지 못했습니다.",
    "Imported external texture.": "외부 텍스처를 가져왔습니다.",
    "Could not import the external texture.": "외부 텍스처를 가져오지 못했습니다.",
    "Loading Preview...": "미리보기 불러오는 중...",
    "Could not preview the external texture.": "외부 텍스처를 미리보지 못했습니다.",
    "Path": "경로",
    "Image Size": "이미지 크기",
    "Yes": "예",
    "No": "아니오",
    "Source": "출처",
    "Import Path": "가져오기 경로",
    "Missing Data": "데이터 없음",
    "PNG is missing, but NineSlice data is available.": "PNG는 없지만 NineSlice 데이터는 있습니다.",
    "Texture data could not be loaded yet.": "텍스처 데이터를 아직 불러오지 못했습니다.",
    "Could not download the external image.": "외부 이미지를 다운로드하지 못했습니다.",
    "Enter a GitHub repository in owner/repo format.": "owner/repo 형식으로 GitHub 리포를 입력해 주세요.",
    "GitHub URL must include owner and repository.": "GitHub URL에는 owner와 repository가 포함되어야 합니다.",
    "GitResource URL must include owner and repository.": "GitResource URL에는 owner와 repository가 포함되어야 합니다.",
    "Only GitHub and GitResource URLs are supported.": "GitHub와 GitResource URL만 지원합니다.",
    "Repository must look like owner/repo.": "리포 형식은 owner/repo여야 합니다.",
    "GitHub API rate limit was hit. Try again later.": "GitHub API 호출 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.",
    "Repository or branch was not found.": "리포 또는 브랜치를 찾을 수 없습니다.",
    "Could not load the selected image from GitHub.": "GitHub에서 선택한 이미지를 불러오지 못했습니다.",
    "Could not download the selected image.": "선택한 이미지를 다운로드하지 못했습니다.",
    "Texture Preview": "텍스처 미리보기",
    "Select a texture from the list to preview it, then double-click it or use the button below.": "목록에서 텍스처를 눌러 미리본 뒤 더블클릭하거나 아래 버튼으로 선택하세요.",
    "The selected texture will appear here.": "선택한 텍스처가 여기에 표시됩니다.",
    "No texture selected yet.": "아직 선택한 텍스처가 없습니다.",
    "Select an element to edit bindings.": "바인딩을 수정하려면 먼저 요소를 선택하세요.",
    "Form File Name (Optional)": "폼 파일 이름 (선택)",
    "Paste JSON-UI Code": "JSON-UI 코드 붙여넣기",
    "Paste an existing JSON-UI form here to load it directly into the editor.": "기존 JSON-UI 폼 코드를 여기에 붙여넣으면 바로 에디터에 불러옵니다.",
    "Load Form": "폼 불러오기",
    "Could not parse the form JSON. Check commas, quotes, and comments.": "폼 JSON을 파싱하지 못했습니다. 쉼표, 따옴표, 주석 문법을 확인해 주세요.",
    "Loaded UI files:": "불러온 UI 파일:",
    "Choose the screen or control you want to open.": "열고 싶은 스크린 또는 컨트롤을 선택하세요.",
    "Search UI controls...": "UI 컨트롤 검색...",
    "Tip: complex controls that depend on unsupported Bedrock features may only load partially in the editor.": "참고: 지원하지 않는 Bedrock 기능에 의존하는 복잡한 컨트롤은 에디터에서 부분적으로만 보일 수 있습니다.",
    "Load Selected UI": "선택한 UI 불러오기",
    "No UI controls were found in the selected folder.": "선택한 폴더에서 UI 컨트롤을 찾지 못했습니다.",
    "Could not prepare the selected UI control.": "선택한 UI 컨트롤을 불러올 준비를 하지 못했습니다.",
    "UI workspace imported. Some advanced controls may appear partially.": "UI 워크스페이스를 불러왔습니다. 일부 고급 컨트롤은 부분적으로만 표시될 수 있습니다.",
    "Unsupported control type:": "지원하지 않는 컨트롤 타입:",
    "Built-in Glyph Sheets": "기본 글리프 시트",
    "Load Built-in Sheet": "기본 시트 불러오기",
    "Upload Edited Glyph Sheet": "수정한 글리프 시트 업로드",
    "Insert Image": "이미지 삽입",
    "Choose Image To Insert": "삽입할 이미지 선택",
    "Selected Cell": "선택한 칸",
    "Slot": "슬롯",
    "Unicode": "유니코드",
    "Glyph Text": "글리프 텍스트",
    "No image selected yet.": "아직 선택한 이미지가 없습니다.",
    "Insert Into Selected Cell": "선택한 칸에 삽입",
    "Copy Selected Glyph Text": "선택한 글리프 텍스트 복사",
    "Clear Selected Cell": "선택한 칸 비우기",
    "Download Glyph Sheet": "글리프 시트 다운로드",
    "Load a built-in glyph sheet, upload an edited sheet to continue working, then insert your image into any slot.": "기본 글리프 시트를 불러오거나 수정한 시트를 다시 업로드한 뒤 원하는 칸에 이미지를 삽입하세요.",
    "Choose a built-in glyph sheet or upload an edited sheet to begin.": "시작하려면 기본 글리프 시트를 고르거나 수정한 시트를 업로드하세요.",
    "Click a cell in the grid to choose where the next image should be inserted.": "그리드에서 칸을 클릭해 다음 이미지를 넣을 위치를 선택하세요.",
    "Please load a glyph sheet first.": "먼저 글리프 시트를 불러오세요.",
    "Please choose an image to insert.": "삽입할 이미지를 먼저 선택하세요.",
    "Inserted image into glyph slot.": "이미지를 글리프 칸에 삽입했습니다.",
    "Cleared glyph slot.": "선택한 글리프 칸을 비웠습니다.",
    "Could not load the glyph sheet.": "글리프 시트를 불러오지 못했습니다.",
    "Could not load the image to insert.": "삽입할 이미지를 불러오지 못했습니다.",
    "Find Empty Slot": "빈 칸 찾기",
    "Selected the next empty glyph slot.": "다음 빈 글리프 칸을 선택했습니다.",
    "No empty glyph slots were found in this sheet.": "이 시트에서는 빈 글리프 칸을 찾지 못했습니다.",
    "Selected glyph text copied to clipboard!": "선택한 글리프 텍스트를 클립보드에 복사했습니다!",
    "Could not copy the selected glyph text.": "선택한 글리프 텍스트를 복사하지 못했습니다.",
};

const PATTERN_TRANSLATORS: PatternTranslator[] = [
    { pattern: /^Signed in as:\s*(.+)$/u, translate: (match) => `로그인됨: ${match[1]}` },
    { pattern: /^Image\s+(.+)\s+not found$/u, translate: (match) => `이미지를 찾을 수 없습니다: ${match[1]}` },
    { pattern: /^Loaded\s+(\d+)\s+files from preset:\s+(.+)$/u, translate: (match) => `프리셋 ${match[2]}에서 파일 ${match[1]}개를 불러왔습니다.` },
    { pattern: /^Successfully uploaded preset "(.+)" with (\d+) file\(s\)$/u, translate: (match) => `프리셋 "${match[1]}"을 업로드했습니다. 파일 ${match[2]}개` },
    { pattern: /^Preset made (public|private)$/u, translate: (match) => `프리셋이 ${match[1] === "public" ? "공개" : "비공개"}로 변경되었습니다.` },
    { pattern: /^Undo \(Ctrl\+Z\) - (\d+) changes$/u, translate: (match) => `되돌리기 (Ctrl+Z) - ${match[1]}개 변경` },
    { pattern: /^Redo \(Ctrl\+Y\) - (\d+) changes$/u, translate: (match) => `다시 실행 (Ctrl+Y) - ${match[1]}개 변경` },
    { pattern: /^Selected file is not a ui folder All textures paths will be starting with "(.+)". May not work in-game!$/u, translate: (match) => `선택한 파일은 ui 폴더가 아닙니다. 모든 텍스처 경로가 "${match[1]}"부터 시작하며 게임에서 동작하지 않을 수 있습니다.` },
    { pattern: /^Selected:\s+(.+)$/u, translate: (match) => `선택됨: ${match[1]}` },
    { pattern: /^Uploaded:\s*(.+)$/u, translate: (match) => `업로드됨: ${match[1]}` },
    { pattern: /^Size:\s*(.+)$/u, translate: (match) => `크기: ${match[1]}` },
    { pattern: /^Base Size:\s*(.+)$/u, translate: (match) => `기본 크기: ${match[1]}` },
    { pattern: /^Loaded (\d+) external images from (.+)\.$/u, translate: (match) => `외부 이미지 ${match[1]}개를 불러왔습니다: ${match[2]}` },
    { pattern: /^Loaded (\d+) external images, but GitHub returned a partial tree\.$/u, translate: (match) => `외부 이미지 ${match[1]}개를 불러왔지만 GitHub 트리 결과가 일부만 반환되었습니다.` },
    { pattern: /^License:\s*(.+)$/u, translate: (match) => `라이선스: ${match[1]}` },
    { pattern: /^GitHub request failed with status (\d+)\.$/u, translate: (match) => `GitHub 요청이 실패했습니다. 상태 코드: ${match[1]}` },
    { pattern: /^Unsupported control type:\s*(.+)$/u, translate: (match) => `지원하지 않는 컨트롤 타입: ${match[1]}` },
    { pattern: /^Loaded built-in glyph sheet:\s*(.+)$/u, translate: (match) => `기본 글리프 시트를 불러왔습니다: ${match[1]}` },
    { pattern: /^Loaded edited glyph sheet:\s*(.+)$/u, translate: (match) => `수정한 글리프 시트를 불러왔습니다: ${match[1]}` },
    { pattern: /^Selected glyph text copied to clipboard!$/u, translate: () => "선택한 글리프 텍스트를 클립보드에 복사했습니다!" },
];

function normalizeText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

export function translateText(text: string | null | undefined): string {
    if (!text) return text ?? "";

    const exactTranslation = EXACT_TRANSLATIONS[text] ?? EXACT_TRANSLATIONS[normalizeText(text)];
    if (exactTranslation) return exactTranslation;

    const normalized = normalizeText(text);
    for (const translator of PATTERN_TRANSLATORS) {
        const match = translator.pattern.exec(normalized);
        if (match) return translator.translate(match);
    }

    return text;
}

function isTranslatableButtonInput(element: Element): element is HTMLInputElement {
    return element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type);
}

function shouldSkipElement(element: Element | null): boolean {
    if (!element) return true;
    if (element.closest("[data-no-translate]")) return true;
    if (element.closest("#main_window")) return true;
    if (element.closest(".textPrompt")) return true;
    return false;
}

function translateAttributes(element: Element): void {
    const attributeNames = ["placeholder", "title", "aria-label", "alt"] as const;

    for (const attributeName of attributeNames) {
        const attributeValue = element.getAttribute(attributeName);
        if (!attributeValue) continue;

        const translatedValue = translateText(attributeValue);
        if (translatedValue !== attributeValue) {
            element.setAttribute(attributeName, translatedValue);
        }
    }

    if (isTranslatableButtonInput(element)) {
        const translatedValue = translateText(element.value);
        if (translatedValue !== element.value) {
            element.value = translatedValue;
        }
    }
}

function translateTextNode(node: Text): void {
    const parent = node.parentElement;
    if (!parent) return;
    if (["SCRIPT", "STYLE", "TEXTAREA", "OPTION"].includes(parent.tagName)) return;
    if (shouldSkipElement(parent)) return;

    const text = node.textContent;
    if (!text || !text.trim()) return;

    const translatedText = translateText(text);
    if (translatedText !== text) {
        node.textContent = translatedText;
    }
}

function translateTree(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node as Text);
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    translateAttributes(element);

    if (shouldSkipElement(element)) return;

    for (const child of Array.from(element.childNodes)) {
        translateTree(child);
    }
}

export function initI18n(): void {
    document.documentElement.lang = "ko";
    document.title = translateText(document.title);
    translateTree(document.body);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                for (const addedNode of Array.from(mutation.addedNodes)) {
                    translateTree(addedNode);
                }
            } else if (mutation.type === "characterData") {
                translateTextNode(mutation.target as Text);
            } else if (mutation.type === "attributes") {
                translateAttributes(mutation.target as Element);
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["placeholder", "title", "aria-label", "alt", "value"],
    });
}

export function confirmLocalized(message: string): boolean {
    return window.confirm(translateText(message));
}
