Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env.local'
$genvidRoot = Join-Path $projectRoot 'integrations\genvid'
$configPath = Join-Path $genvidRoot 'config.yaml'

function Get-EnvMap {
  param([string]$Path)

  $map = @{}
  if (-not (Test-Path $Path)) {
    throw "Environment file tidak ditemukan: $Path"
  }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }

    $index = $trimmed.IndexOf('=')
    if ($index -lt 1) {
      continue
    }

    $key = $trimmed.Substring(0, $index).Trim()
    $value = $trimmed.Substring($index + 1).Trim().Trim('"')
    $map[$key] = $value
  }

  return $map
}

function Escape-Yaml {
  param([string]$Value)

  if ($null -eq $Value) {
    return '""'
  }

  $escaped = $Value.Replace('\', '\\').Replace('"', '\"')
  return '"' + $escaped + '"'
}

function Test-PortOpen {
  param([int]$Port)

  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
    return $null -ne $connection
  } catch {
    return $false
  }
}

$envMap = Get-EnvMap -Path $envPath

$openAiKey = $envMap['OPENAI_API_KEY']
$openRouterKey = $envMap['OPENROUTER_API_KEY']
$videoApiKey = $envMap['VIDEO_API_KEY']
$openAiProviderKey = if ($openAiKey) { $openAiKey } else { $videoApiKey }
$llmKey = if ($openRouterKey) { $openRouterKey } elseif ($openAiKey) { $openAiKey } else { $videoApiKey }

if (-not $llmKey) {
  throw 'OPENROUTER_API_KEY, OPENAI_API_KEY, atau VIDEO_API_KEY wajib diisi di .env.local untuk Genvid lokal.'
}

$llmBaseUrl = if ($envMap['GENVID_LLM_BASE_URL']) {
  $envMap['GENVID_LLM_BASE_URL']
} elseif ($openRouterKey) {
  'https://openrouter.ai/api/v1'
} else {
  'https://api.openai.com/v1'
}

$llmModel = if ($envMap['GENVID_LLM_MODEL']) {
  $envMap['GENVID_LLM_MODEL']
} elseif ($openRouterKey) {
  'google/gemini-2.5-flash'
} else {
  'gpt-4o-mini'
}

$frameTemplate = if ($envMap['GENVID_FRAME_TEMPLATE']) {
  $envMap['GENVID_FRAME_TEMPLATE']
} elseif ($openRouterKey) {
  '1080x1920/static_default.html'
} else {
  '1080x1920/image_default.html'
}

$yaml = @"
project_name: AI ASSISTENT Genvid

llm:
  api_key: $(Escape-Yaml $llmKey)
  base_url: $(Escape-Yaml $llmBaseUrl)
  model: $(Escape-Yaml $llmModel)

api_providers:
  common:
    print_model_input: false
    local_proxy: ""
  openai:
    api_key: $(Escape-Yaml $openAiProviderKey)
    base_url: "https://api.openai.com/v1"
    use_proxy: false
  dashscope:
    api_key: ""
    base_url: "https://dashscope.aliyuncs.com/api/v1"
    use_proxy: false
  deepseek:
    api_key: ""
    base_url: ""
    use_proxy: false
  gemini:
    api_key: ""
    base_url: ""
    use_proxy: false
  ark:
    api_key: ""
    base_url: "https://ark.cn-beijing.volces.com/api/v3"
    use_proxy: false
  kling:
    base_url: "https://api-beijing.klingai.com"
    access_key: ""
    secret_key: ""
    use_proxy: false

comfyui:
  comfyui_url: "http://127.0.0.1:8188"
  comfyui_api_key: ""
  runninghub_api_key: ""
  runninghub_concurrent_limit: 1
  tts:
    inference_mode: "local"
    local:
      voice: "en-US-AndrewNeural"
      speed: 1.0
    comfyui:
      default_workflow: "selfhost/tts_edge.json"
  image:
    default_workflow: "api/openai/gpt-image-2"
    prompt_prefix: "Cinematic, clean composition, polished storytelling frame, high detail"
  video:
    default_workflow: ""
    prompt_prefix: "Cinematic, clean composition, polished storytelling frame, high detail"

template:
  default_template: $(Escape-Yaml $frameTemplate)
"@

Set-Content -LiteralPath $configPath -Value $yaml -Encoding UTF8

Push-Location $genvidRoot
try {
  $env:PYTHONIOENCODING = 'utf-8'
  $env:PYTHONUTF8 = '1'
  uv sync

  if (Test-PortOpen -Port 8000) {
    Write-Output 'Genvid API sudah aktif di port 8000.'
    exit 0
  }

  uv run python api/app.py --host 127.0.0.1 --port 8000
} finally {
  Pop-Location
}
