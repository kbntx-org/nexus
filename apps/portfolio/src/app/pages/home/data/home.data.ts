export interface HeroData {
  name: string;
  title: string;
  subtitle: string;
  description: string;
}

export const HERO_DATA: HeroData = {
  name: 'Kenny',
  title: 'Platform Engineer',
  subtitle: 'Passionate about exploring every step of software development, from full-stack development to platform engineering, focusing on optimizing and scaling cloud-based systems for fast, reliable software delivery.',
  description: `I'm a Senior Platform Engineer with a full-stack background, focused on building the systems, tooling, and workflows that let engineers ship quickly, safely, and with confidence. Over the years, I've grown from product engineering into platform work, where I now spend my time improving our cloud and Kubernetes foundations, accelerating CI/CD, shaping our observability stack, and enabling real self-service across teams. <br> <br> At PowerUs ⚡️, I'm leading initiatives that modernize our infrastructure, strengthen reliability, shorten the feedback loop, and reduce costs. I enjoy tackling system-level challenges, supporting engineers on architectural decisions, and building internal tooling that removes friction from everyday development. My goal is always the same: reduce friction, shorten the feedback loop, and let engineers focus on shipping value rather than fighting infrastructure.`
};
