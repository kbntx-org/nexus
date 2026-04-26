DOCKER_CONTEXT = "kind-kind"

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
config.define_string_list("profile", args=False, usage="Dev profiles: docs | portfolio | all")
parsedConfig = config.parse()
selectedProfiles = parsedConfig.get("profile", [])

CORE_RESOURCES = ['traefik', 'metrics-server-repo', 'metrics-server']

SERVICES = {
  'docs':      ['docs'],
  'portfolio': ['portfolio'],
  'all':       ['docs', 'portfolio'],
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

config.set_enabled_resources(CORE_RESOURCES + enabledResources)
print("🚀 Profiles: %s — enabling: %s" % (selectedProfiles or ['all'], ', '.join(enabledResources)))

bootstrap_kubernetes(DOCKER_CONTEXT)

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

# ── Traefik (auto-started as a dependency of all product services) ─────────────
helm_resource(
  'traefik',
  'platform/traefik',
  deps=['platform/traefik'],
  namespace='traefik',
  flags=[
    '--create-namespace',
    '--values', 'platform/traefik/values.local.yaml',
  ],
  labels=['infra'],
)

# ── Docs ──────────────────────────────────────────────────────────────────────
docker_build(
  'documentation',
  'docs',
  dockerfile='docs/Dockerfile.local',
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
  labels=['product'],
)
