import type { HermesSkillDefinition } from '@/lib/hermes/contracts/skill';
import { hermesSeedSkills } from '@/lib/hermes/seed/skills';

export class SkillRegistry {
  private readonly skills: HermesSkillDefinition[];
  private readonly seedSkillNames: Set<string>;

  constructor(skills: HermesSkillDefinition[] = hermesSeedSkills) {
    this.skills = [...skills];
    this.seedSkillNames = new Set(skills.map((skill) => skill.name));
  }

  list(): HermesSkillDefinition[] {
    return [...this.skills];
  }

  getByName(name: string): HermesSkillDefinition | undefined {
    return this.skills.find((skill) => skill.name === name);
  }

  has(name: string) {
    return this.skills.some((skill) => skill.name === name);
  }

  register(skill: HermesSkillDefinition) {
    const existingIndex = this.skills.findIndex((entry) => entry.name === skill.name);
    if (existingIndex >= 0) {
      if (this.seedSkillNames.has(skill.name)) {
        return this.skills[existingIndex];
      }

      this.skills.splice(existingIndex, 1, skill);
      return skill;
    }

    this.skills.push(skill);
    return skill;
  }

  unregister(name: string) {
    if (this.seedSkillNames.has(name)) {
      return false;
    }

    const existingIndex = this.skills.findIndex((entry) => entry.name === name);
    if (existingIndex < 0) {
      return false;
    }

    this.skills.splice(existingIndex, 1);
    return true;
  }
}
