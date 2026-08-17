load('./platform/core/local/platform.tilt', 'CORE_RESOURCES', 'OPTIONAL_RESOURCES', 'PERSISTED_ON_DOWN')
load('./platform/core/local/apps.tilt', 'PRODUCT_RESOURCES')

# Resources named on the command line (e.g. `tilt up -- docs`) are enabled in
# addition to CORE_RESOURCES. Nothing outside CORE_RESOURCES runs by default —
# start docs/portfolio/monitoring explicitly, or enable them from the Tilt UI.
config.define_string_list("resources", args=True)
requestedResources = config.parse().get("resources", [])

if config.tilt_subcommand != 'down':
  config.set_enabled_resources(CORE_RESOURCES + requestedResources)
else:
  allResources = CORE_RESOURCES + OPTIONAL_RESOURCES + PRODUCT_RESOURCES
  config.set_enabled_resources([resource for resource in allResources if resource not in PERSISTED_ON_DOWN])
  print("🛑 Cleaning up (preserving: %s)" % ', '.join(PERSISTED_ON_DOWN))
