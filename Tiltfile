DOCKER_CONTEXT = "kind-kind"

default_registry(
  "localhost:5005",
  host_from_cluster="kind-registry:5000",
)

load('ext://helm_resource', 'helm_resource', 'helm_repo')

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

CORE_RESOURCES = ['traefik']

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
  image_keys=['image'],
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
  image_keys=['image'],
  namespace='default',
  flags=[
    '--values', 'apps/portfolio/chart/values.local.yaml',
    '--create-namespace',
  ],
  labels=['product'],
)
