DOCKER_CONTEXT = "kind-kind"
update_settings(max_parallel_updates=6)

default_registry(
  "localhost:5005",
  host_from_cluster="kind-registry:5000",
)

load('ext://helm_resource', 'helm_resource', 'helm_repo')

def dotenv_helm_flags(path):
  content = str(read_file(path, default=''))
  flags = []
  index = 0
  for line in content.splitlines():
    line = line.strip()
    if not line or line.startswith('#'):
      continue
    separator = line.index('=')
    key   = line[:separator]
    value = line[separator + 1:]
    if len(value) >= 2 and value[0] == '"' and value[-1] == '"':
      value = value[1:-1]
    if len(value) >= 2 and value[0] == "'" and value[-1] == "'":
      value = value[1:-1]
    flags += [
      '--set', 'extraEnv[%d].name=%s'  % (index, key),
      '--set', 'extraEnv[%d].value=%s' % (index, value),
    ]
    index += 1
  return flags

def helm_chart_deps(chartPath):
  if config.tilt_subcommand == 'down':
    return
  chartYaml = read_yaml(chartPath + '/Chart.yaml')
  for dependency in chartYaml.get('dependencies') or []:
    repository = dependency.get('repository', '')
    if repository.startswith('http://') or repository.startswith('https://'):
      local('helm repo add %s %s --force-update' % (dependency['name'], repository), quiet=True)
  local('helm dependency build ' + chartPath, quiet=True)

def bootstrap_kubernetes(kubernetesContext):
  availableContexts = [
    contextName
    for contextName in str(local("kubectl config get-contexts -o name", quiet=True)).split("\n")
    if contextName
  ]

  if kubernetesContext not in availableContexts:
    fail("Kubernetes context '%s' does not exist." % kubernetesContext)

  local("kubectl config use-context %s" % kubernetesContext, quiet=True)

  clusterHealth = str(local(
    "kubectl get --raw=/healthz 2>&1 || echo 'unhealthy'",
    quiet=True,
  )).strip()

  if clusterHealth != "ok":
    fail("Kubernetes is not running or API server is not reachable.")

  print("✅ Kubernetes cluster running, starting local dev")

# ── Profiles ──────────────────────────────────────────────────────────────────
config.define_string_list("profile", args=False, usage="Dev profiles: docs | portfolio | monitoring | all")
parsedConfig = config.parse()
selectedProfiles = parsedConfig.get("profile", [])

CORE_RESOURCES = ['vault', 'external-secrets', 'traefik', 'metrics-server-repo', 'metrics-server', 'cloudnative-pg']

# Stateful infra that should survive `tilt down` so we don't waste minutes
# re-installing the operator on every cycle.
PERSISTED_ON_DOWN = ['cloudnative-pg']

SERVICES = {
  'docs':       ['docs'],
  'portfolio':  ['portfolio'],
  'monitoring': ['monitoring'],
  'all':        ['docs', 'portfolio'],
}

if selectedProfiles:
  invalidProfiles = [profile for profile in selectedProfiles if profile not in SERVICES]
  if invalidProfiles:
    fail("Unknown profile(s): %s. Valid: %s" % (', '.join(invalidProfiles), ', '.join(SERVICES.keys())))
  enabledResources = []
  for profile in selectedProfiles:
    for resource in SERVICES[profile]:
      if resource not in enabledResources:
        enabledResources.append(resource)
else:
  enabledResources = list(SERVICES['all'])

if config.tilt_subcommand != 'down':
  config.set_enabled_resources(CORE_RESOURCES + enabledResources)
  print("🚀 Profiles: %s — enabling: %s" % (selectedProfiles or ['all'], ', '.join(enabledResources)))
else:
  resourcesToTearDown = [r for r in CORE_RESOURCES + enabledResources if r not in PERSISTED_ON_DOWN]
  config.set_enabled_resources(resourcesToTearDown)
  print("🛑 Cleaning up (preserving: %s)" % ', '.join(PERSISTED_ON_DOWN))

bootstrap_kubernetes(DOCKER_CONTEXT)

helm_chart_deps('platform/core/external-secrets')
helm_resource(
  'external-secrets',
  'platform/core/external-secrets',
  namespace='external-secrets',
  flags=['--create-namespace'],
  deps=['platform/core/external-secrets'],
  labels=['infra'],
)

helm_repo(
  'metrics-server-repo',
  'https://kubernetes-sigs.github.io/metrics-server/',
  labels=['infra'],
)

helm_resource(
  'metrics-server',
  'metrics-server-repo/metrics-server',
  namespace='kube-system',
  flags=[
    '--version=3.13.0',
    '--set-json=args=["--kubelet-insecure-tls", "--kubelet-preferred-address-types=InternalIP"]',
  ],
  resource_deps=['metrics-server-repo'],
  labels=['infra'],
)

helm_resource(
  'vault',
  'platform/core/vault/server',
  namespace='default',
  flags=[
    '--values', 'platform/core/vault/server/values.local.yaml',
    '--create-namespace',
  ],
  deps=['platform/core/vault/server'],
  labels=['infra'],
  links=[link('http://vault.localhost', 'vault.localhost')],
)

# ── Traefik (auto-started as a dependency of all product services) ─────────────
helm_resource(
  'traefik',
  'platform/core/traefik',
  deps=['platform/core/traefik'],
  namespace='traefik',
  flags=[
    '--create-namespace',
    '--values', 'platform/core/traefik/values.local.yaml',
  ],
  labels=['infra'],
)

# ── CloudNative-PG (Postgres operator, required by monitoring) ────────────────
helm_chart_deps('platform/core/cloudnative-pg')
helm_resource(
  'cloudnative-pg',
  'platform/core/cloudnative-pg',
  namespace='cloudnative-pg',
  flags=['--create-namespace'],
  deps=['platform/core/cloudnative-pg'],
  labels=['infra'],
)

# ── Monitoring (VictoriaMetrics + Grafana + Loki + node/kube-state metrics) ───
helm_chart_deps('platform/services/monitoring')
helm_resource(
  'monitoring',
  'platform/services/monitoring',
  namespace='monitoring',
  flags=[
    '--values', 'platform/services/monitoring/values.local.yaml',
    '--create-namespace',
  ],
  deps=['platform/services/monitoring'],
  resource_deps=['vault', 'external-secrets', 'cloudnative-pg', 'traefik'],
  labels=['infra'],
  links=[link('http://grafana.localhost', 'grafana.localhost')],
)

# ── Docs ──────────────────────────────────────────────────────────────────────
docker_build(
  'documentation',
  'docs',
  dockerfile='docs/Dockerfile',
  target='local',
  live_update=[
    sync('docs/src', '/workspace/src'),
    sync('docs/mkdocs.yml', '/workspace/mkdocs.yml'),
  ],
)

helm_resource(
  'docs',
  'docs/helm',
  deps=['docs/helm'],
  image_deps=['documentation'],
  image_keys=[('image.repository', 'image.tag')],
  namespace='default',
  flags=[
    '--values', 'docs/helm/values.local.yaml',
    '--create-namespace',
  ],
  links=[link('http://docs.localhost', 'docs.localhost')],
  labels=['product'],
)

# ── Portfolio ─────────────────────────────────────────────────────────────────
docker_build(
  'portfolio',
  '.',
  dockerfile='apps/portfolio/Dockerfile.local',
  only=[
    'apps/portfolio',
    'tsconfig.base.json',
    'nx.json',
    'tools',
    'pnpm-lock.yaml',
    'package.json',
    '.npmrc',
    'pnpm-workspace.yaml',
  ],
  live_update=[
    sync('apps/portfolio/package.json', '/usr/src/app/apps/portfolio/package.json'),
    sync('apps/portfolio/src', '/usr/src/app/apps/portfolio/src'),
    sync('tsconfig.base.json', '/usr/src/app/tsconfig.base.json'),
    run('cd /usr/src/app && pnpm install --no-frozen-lockfile', trigger=['apps/portfolio/package.json']),
  ],
)

helm_resource(
  'portfolio',
  'apps/portfolio/chart',
  deps=['apps/portfolio/chart'],
  image_deps=['portfolio'],
  image_keys=[('image.repository', 'image.tag')],
  namespace='default',
  flags=[
    '--values', 'apps/portfolio/chart/values.local.yaml',
    '--create-namespace',
  ],
  links=[link('http://portfolio.localhost', 'portfolio.localhost')],
  labels=['product'],
)
