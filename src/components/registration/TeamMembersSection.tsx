import React from 'react';
import { Users, UserPlus, Trash2, Crown, AlertCircle } from 'lucide-react';
import { TeamMember } from '../../types';

interface TeamMembersSectionProps {
  teamName: string;
  teamMembers: TeamMember[];
  minTeamSize: number;
  maxTeamSize: number;
  errors: {
    teamName?: string;
    teamSize?: string;
    members?: Record<number, { name?: string; email?: string; phone?: string; studentId?: string }>;
  };
  onTeamNameChange: (name: string) => void;
  onMembersChange: (members: TeamMember[]) => void;
}

export const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  teamName,
  teamMembers,
  minTeamSize,
  maxTeamSize,
  errors,
  onTeamNameChange,
  onMembersChange
}) => {
  const currentCount = teamMembers.length;
  const canAddMember = currentCount < maxTeamSize;
  const canRemoveMember = (index: number) => {
    // Primary registrant (index 0) cannot be removed
    if (index === 0) return false;
    return true;
  };

  const handleAddMember = () => {
    if (!canAddMember) return;
    const newMember: TeamMember = {
      name: '',
      email: '',
      phone: '',
      institution: '',
      studentId: '',
      role: `Member ${currentCount + 1}`
    };
    onMembersChange([...teamMembers, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    if (!canRemoveMember(index)) return;
    const updated = teamMembers.filter((_, i) => i !== index);
    onMembersChange(updated);
  };

  const handleMemberChange = (
    index: number,
    field: keyof TeamMember,
    val: string
  ) => {
    const updated = [...teamMembers];
    updated[index] = {
      ...updated[index],
      [field]: val
    };
    onMembersChange(updated);
  };

  return (
    <div className="space-y-6 pt-4 border-t border-[#242730]">
      {/* Header and counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#ff4f1a]" />
          <div>
            <h3 className="font-heading text-sm font-bold text-white">
              Team Registration Details
            </h3>
            <p className="text-xs text-[#9da3b4]">
              Configure your team roster. Requirements: Min {minTeamSize}, Max {maxTeamSize} members.
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
              currentCount < minTeamSize || currentCount > maxTeamSize
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {currentCount} / {maxTeamSize} Members
          </span>
        </div>
      </div>

      {/* Global Team Size error */}
      {errors.teamSize && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.teamSize}</span>
        </div>
      )}

      {/* Team Name Input */}
      <div className="space-y-1.5">
        <label htmlFor="team-name-input" className="text-xs font-medium text-[#d1d5db] flex items-center gap-1">
          <span>Team Name</span>
          <span className="text-[#ff4f1a] font-bold">*</span>
        </label>
        <input
          id="team-name-input"
          type="text"
          placeholder="e.g. Code Voyagers or Neural Ninjas"
          value={teamName}
          onChange={(e) => onTeamNameChange(e.target.value)}
          className={`w-full bg-[#191b20] border rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none transition-colors ${
            errors.teamName
              ? 'border-red-500/80 focus:border-red-500'
              : 'border-[#2e3442] focus:border-[#ff4f1a]'
          }`}
        />
        {errors.teamName && (
          <p className="text-[11px] text-red-400 font-medium">{errors.teamName}</p>
        )}
      </div>

      {/* Team Member Cards */}
      <div className="space-y-4">
        {teamMembers.map((member, index) => {
          const isLeader = index === 0;
          const memberError = errors.members?.[index];

          return (
            <div
              key={index}
              className="p-4 sm:p-5 rounded-2xl bg-[#191b20]/60 border border-[#2e3442] space-y-4 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLeader ? (
                    <span className="px-2 py-0.5 rounded-md bg-[#ff4f1a]/20 text-[#ff4f1a] text-[10px] font-mono font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Team Leader (You)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-[#242730] text-[#9da3b4] text-[10px] font-mono font-bold">
                      Member #{index + 1}
                    </span>
                  )}
                </div>

                {!isLeader && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(index)}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 px-2 py-1 rounded transition-colors"
                    title={`Remove Member ${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Grid of inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#9da3b4] flex items-center gap-1">
                    <span>Full Name</span>
                    <span className="text-[#ff4f1a] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Member full name"
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                    className={`w-full bg-[#14161a] border rounded-lg px-3 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none transition-colors ${
                      memberError?.name ? 'border-red-500' : 'border-[#2e3442] focus:border-[#ff4f1a]'
                    }`}
                  />
                  {memberError?.name && (
                    <p className="text-[10px] text-red-400">{memberError.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#9da3b4] flex items-center gap-1">
                    <span>Email Address</span>
                    <span className="text-[#ff4f1a] font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="member@university.edu"
                    value={member.email}
                    onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                    className={`w-full bg-[#14161a] border rounded-lg px-3 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none transition-colors ${
                      memberError?.email ? 'border-red-500' : 'border-[#2e3442] focus:border-[#ff4f1a]'
                    }`}
                  />
                  {memberError?.email && (
                    <p className="text-[10px] text-red-400">{memberError.email}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#9da3b4]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+880 1700-000000"
                    value={member.phone || ''}
                    onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                    className={`w-full bg-[#14161a] border rounded-lg px-3 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none transition-colors ${
                      memberError?.phone ? 'border-red-500' : 'border-[#2e3442] focus:border-[#ff4f1a]'
                    }`}
                  />
                  {memberError?.phone && (
                    <p className="text-[10px] text-red-400">{memberError.phone}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#9da3b4]">
                    Institution / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE, DU / DRMC"
                    value={member.institution || ''}
                    onChange={(e) => handleMemberChange(index, 'institution', e.target.value)}
                    className="w-full bg-[#14161a] border border-[#2e3442] rounded-lg px-3 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAddMember}
          disabled={!canAddMember}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#2e3442] hover:border-[#ff4f1a] bg-[#14161a] hover:bg-[#191b20] text-xs font-semibold text-[#d1d5db] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4 text-[#ff4f1a]" />
          <span>
            {canAddMember
              ? `Add Team Member (${currentCount}/${maxTeamSize})`
              : `Maximum Team Size Reached (${maxTeamSize} Members)`}
          </span>
        </button>
      </div>
    </div>
  );
};
