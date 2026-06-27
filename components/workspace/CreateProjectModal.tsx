'use client';

import React, { useState } from 'react';
import {
  X,
  Folder,
  ChevronDown,
  Check,
  Presentation,
  FileText,
  Grid,
  Globe,
  Video,
  Zap,
  Search,
  PenTool,
  Code,
  BarChart2
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/workspace-context';

const SKILLS_LIST = [
  { name: 'Slides', icon: Presentation, desc: 'Presentasi & pitch deck' },
  { name: 'Documents', icon: FileText, desc: 'Laporan, dokumen tulisan & copy' },
  { name: 'Sheets', icon: Grid, desc: 'Pemrosesan data & spreadsheet' },
  { name: 'Websites', icon: Globe, desc: 'Pengembangan web & scraping' },
  { name: 'Videos', icon: Video, desc: 'Pembuatan & pengeditan video' }
];

const GOALS_LIST = [
  { name: 'Quick Task', icon: Zap, desc: 'Eksekusi cepat orientasi waktu' },
  { name: 'Deep Research', icon: Search, desc: 'Riset mendalam berbasis web' },
  { name: 'Create Content', icon: PenTool, desc: 'Pembuatan konten & aset visual' },
  { name: 'Build Project', icon: Code, desc: 'Coding, integrasi & build software' },
  { name: 'Analyze Data', icon: BarChart2, desc: 'Analisis data & spreadsheet kompleks' }
];

export default function CreateProjectModal({
  onClose
}: {
  onClose: () => void;
}) {
  const { createNewProject } = useWorkspace();
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjSkill, setNewProjSkill] = useState('Documents');
  const [newProjGoal, setNewProjGoal] = useState('Quick Task');

  // Custom dropdown states
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    createNewProject(newProjName.trim(), newProjDesc.trim(), newProjSkill, newProjGoal);
    setNewProjName('');
    setNewProjDesc('');
    onClose();
  };

  const selectedSkillObj = SKILLS_LIST.find(s => s.name === newProjSkill) || SKILLS_LIST[1];
  const selectedGoalObj = GOALS_LIST.find(g => g.name === newProjGoal) || GOALS_LIST[0];

  const SkillIcon = selectedSkillObj.icon;
  const GoalIcon = selectedGoalObj.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all duration-300">

      {/* Background click handlers to close dropdowns */}
      {(skillDropdownOpen || goalDropdownOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setSkillDropdownOpen(false);
            setGoalDropdownOpen(false);
          }}
        />
      )}

      <div className="relative z-20 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.15)] animate-fade-in">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 rounded-lg p-1.5 hover:bg-slate-100 transition active:scale-95"
          aria-label="Tutup modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              Inisiasi Project Baru
            </h3>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Buat workspace project baru untuk dieksekusi secara terfokus oleh tim AI agent.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateProjectSubmit} className="mt-5 space-y-4">

          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider uppercase font-bold text-slate-500 font-mono">
              Nama Project
            </label>
            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="Contoh: Medicare App Pitch Deck"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all duration-300"
              required
              autoFocus
            />
          </div>

          {/* Project Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider uppercase font-bold text-slate-500 font-mono">
              Deskripsi Project
            </label>
            <textarea
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
              placeholder="Tulis tujuan proyek atau sasaran bisnis proyek ini..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none min-h-[80px] resize-none transition-all duration-300"
            />
          </div>

          {/* Custom Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Custom Default Skill Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] tracking-wider uppercase font-bold text-slate-500 font-mono">
                Default Skill
              </label>

              <button
                type="button"
                onClick={() => {
                  setSkillDropdownOpen(!skillDropdownOpen);
                  setGoalDropdownOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 hover:border-slate-300 focus:border-indigo-400 focus:outline-none transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <SkillIcon className="h-4 w-4 text-indigo-500" />
                  <span>{newProjSkill}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${skillDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {skillDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] animate-fade-in max-h-56 overflow-y-auto">
                  {SKILLS_LIST.map((skill) => {
                    const Icon = skill.icon;
                    const isSelected = newProjSkill === skill.name;
                    return (
                      <button
                        key={skill.name}
                        type="button"
                        onClick={() => {
                          setNewProjSkill(skill.name);
                          setSkillDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-all ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <div className="text-left">
                            <span className="block font-medium">{skill.name}</span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">{skill.desc}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Goal Utama Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] tracking-wider uppercase font-bold text-slate-500 font-mono">
                Goal Utama
              </label>

              <button
                type="button"
                onClick={() => {
                  setGoalDropdownOpen(!goalDropdownOpen);
                  setSkillDropdownOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 hover:border-slate-300 focus:border-indigo-400 focus:outline-none transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <GoalIcon className="h-4 w-4 text-indigo-500" />
                  <span>{newProjGoal}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${goalDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {goalDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] animate-fade-in max-h-56 overflow-y-auto">
                  {GOALS_LIST.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = newProjGoal === goal.name;
                    return (
                      <button
                        key={goal.name}
                        type="button"
                        onClick={() => {
                          setNewProjGoal(goal.name);
                          setGoalDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-all ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
                          <div className="text-left">
                            <span className="block font-medium">{goal.name}</span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">{goal.desc}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400"
            >
              Buat Project Workspace
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
