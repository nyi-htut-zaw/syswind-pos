import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  X, 
  RefreshCw, 
  Shield, 
  Building2,
  Lock,
  Plus,
  Save,
  Check,
  User as UserIcon,
  Trash2,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { User, UserRole, Organization, Role, Permission } from '../types';
import { api, formatDate, hasPermission } from '../api/client';
import { ImageUpload } from '../components/ImageUpload';

interface UsersPageProps {
  currentUser?: User | null;
  onUserUpdated?: (user: User) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ currentUser, onUserUpdated }) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'organizations' | 'roles' | 'users' | 'audit'>('profile');
  const [loading, setLoading] = useState(false);

  // 1. My Profile / User Center State
  const [profile, setProfile] = useState<User | null>(currentUser || null);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  // 2. Organizations State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [addOrgModalOpen, setAddOrgModalOpen] = useState(false);
  const [editOrgModalOpen, setEditOrgModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgCity, setOrgCity] = useState('Yangon');
  const [orgState, setOrgState] = useState('Yangon');
  const [orgTaxNumber, setOrgTaxNumber] = useState('');
  const [orgCurrency, setOrgCurrency] = useState('MMK');
  const [orgSubmitting, setOrgSubmitting] = useState(false);

  // 3. Dynamic Roles & Permissions Matrix State
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [menus, setMenus] = useState<Permission[]>([]);
  const [buttons, setButtons] = useState<Permission[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<string>('');
  const [selectedPermCodes, setSelectedPermCodes] = useState<string[]>([]);
  const [roleSaving, setRoleSaving] = useState(false);
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // 4. Staff & Users State
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('SALES_STAFF');
  const [newUserRoleId, setNewUserRoleId] = useState('');
  const [newUserOrgId, setNewUserOrgId] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('');

  // Edit User Modal
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('SALES_STAFF');
  const [editRoleId, setEditRoleId] = useState('');
  const [editOrgId, setEditOrgId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');

  // 5. Audit Trail State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Load all foundational data
  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, meRes, orgRes, rolesRes, permsRes, aRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/auth/me').catch(() => null),
        api.get('/organizations').catch(() => ({ organizations: [] })),
        api.get('/roles').catch(() => ({ roles: [] })),
        api.get('/roles/permissions').catch(() => ({ permissions: [], menus: [], buttons: [] })),
        api.get('/audit-logs?limit=100').catch(() => ({ logs: [] })),
      ]);

      setUsers(uRes?.users || []);
      setOrganizations(orgRes?.organizations || []);
      setAuditLogs(aRes?.logs || []);

      if (meRes?.user) {
        setProfile(meRes.user);
        setFullName(meRes.user.full_name || '');
        setPhone(meRes.user.phone || '');
        setBio(meRes.user.bio || '');
        setAvatarUrl(meRes.user.avatar_url || '');
        if (onUserUpdated) onUserUpdated(meRes.user);
      }

      if (orgRes?.organizations?.length > 0) {
        const found = orgRes.organizations.find((o: Organization) => o.id === meRes?.user?.organization_id) || orgRes.organizations[0];
        setCurrentOrg(found);
      }

      const rList: Role[] = rolesRes?.roles || [];
      setRoles(rList);
      if (rList.length > 0 && !activeRoleId) {
        setActiveRoleId(rList[0].id);
        setSelectedPermCodes(rList[0].permission_codes || []);
      }

      setAllPermissions(permsRes?.permissions || []);
      setMenus(permsRes?.menus || (permsRes?.permissions || []).filter((p: Permission) => p.type === 'MENU'));
      setButtons(permsRes?.buttons || (permsRes?.permissions || []).filter((p: Permission) => p.type === 'BUTTON'));
    } catch (err) {
      console.error('Failed to load UsersPage data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When changing active role in matrix
  const handleSelectRole = (role: Role) => {
    setActiveRoleId(role.id);
    setSelectedPermCodes(role.permission_codes || []);
  };

  // Toggle permission checkbox
  const togglePermissionCode = (code: string) => {
    setSelectedPermCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Save selected role's permissions
  const handleSaveRolePermissions = async () => {
    if (!activeRoleId) return;
    try {
      setRoleSaving(true);
      const activeRole = roles.find(r => r.id === activeRoleId);
      await api.put(`/roles/${activeRoleId}`, {
        display_name: activeRole?.display_name,
        description: activeRole?.description,
        permission_codes: selectedPermCodes,
      });

      // Update local state
      setRoles(prev => prev.map(r => r.id === activeRoleId ? { ...r, permission_codes: selectedPermCodes } : r));
      alert(`Permissions updated successfully for "${activeRole?.display_name || 'Role'}"!`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role permissions');
    } finally {
      setRoleSaving(false);
    }
  };

  // Create new Custom Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode.trim() || !newRoleDisplayName.trim()) {
      alert('Please fill role code and display name');
      return;
    }
    try {
      const res = await api.post('/roles', {
        name: newRoleCode.trim(),
        display_name: newRoleDisplayName.trim(),
        description: newRoleDesc.trim() || null,
        permission_codes: ['menu:dashboard'],
      });
      setAddRoleModalOpen(false);
      setNewRoleCode('');
      setNewRoleDisplayName('');
      setNewRoleDesc('');
      await loadData();
      if (res?.role?.id) {
        setActiveRoleId(res.role.id);
        setSelectedPermCodes(['menu:dashboard']);
      }
      alert('New role created! You can now map menus and buttons to it.');
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    }
  };

  // Delete Custom Role
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"?`)) return;
    try {
      await api.delete(`/roles/${roleId}`);
      await loadData();
      alert('Role deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  // 1. My Profile Submit
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const res = await api.put('/auth/profile', {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
      });

      if (res?.user) {
        setProfile(res.user);
        if (onUserUpdated) onUserUpdated(res.user);
      }
      alert('Profile details updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    try {
      setPasswordChanging(true);
      await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully! Please remember your new password.');
    } catch (err: any) {
      alert(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordChanging(false);
    }
  };

  // 2. Organization Handlers
  const openAddOrgModal = () => {
    setOrgName('');
    setOrgCode('');
    setOrgLogoUrl('');
    setOrgPhone('');
    setOrgEmail('');
    setOrgAddress('');
    setOrgCity('Yangon');
    setOrgState('Yangon');
    setOrgTaxNumber('');
    setOrgCurrency('MMK');
    setAddOrgModalOpen(true);
  };

  const openEditOrgModal = (org: Organization) => {
    setSelectedOrg(org);
    setOrgName(org.name || '');
    setOrgCode(org.code || '');
    setOrgLogoUrl(org.logo_url || '');
    setOrgPhone(org.phone || '');
    setOrgEmail(org.email || '');
    setOrgAddress(org.address || '');
    setOrgCity(org.city || 'Yangon');
    setOrgState(org.state_division || 'Yangon');
    setOrgTaxNumber(org.tax_number || '');
    setOrgCurrency(org.currency || 'MMK');
    setEditOrgModalOpen(true);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgCode.trim()) {
      alert('Organization name and code are required.');
      return;
    }
    try {
      setOrgSubmitting(true);
      await api.post('/organizations', {
        name: orgName.trim(),
        code: orgCode.trim(),
        logo_url: orgLogoUrl || null,
        phone: orgPhone.trim() || null,
        email: orgEmail.trim() || null,
        address: orgAddress.trim() || null,
        city: orgCity,
        state_division: orgState,
        tax_number: orgTaxNumber.trim() || null,
        currency: orgCurrency,
      });
      setAddOrgModalOpen(false);
      loadData();
      alert('Organization created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create organization');
    } finally {
      setOrgSubmitting(false);
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      setOrgSubmitting(true);
      await api.put(`/organizations/${selectedOrg.id}`, {
        name: orgName.trim(),
        code: orgCode.trim(),
        logo_url: orgLogoUrl || null,
        phone: orgPhone.trim() || null,
        email: orgEmail.trim() || null,
        address: orgAddress.trim() || null,
        city: orgCity,
        state_division: orgState,
        tax_number: orgTaxNumber.trim() || null,
        currency: orgCurrency,
      });
      setEditOrgModalOpen(false);
      setSelectedOrg(null);
      loadData();
      alert('Organization updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update organization');
    } finally {
      setOrgSubmitting(false);
    }
  };

  // 4. Staff / User Handlers
  const openEditUserModal = (u: User) => {
    setSelectedUser(u);
    setEditFullName(u.full_name || '');
    setEditRole(u.role);
    const matchedRole = roles.find(r => r.name === u.role);
    setEditRoleId(u.role_id || (u as any).custom_role_id || matchedRole?.id || '');
    setEditOrgId(u.organization_id || '');
    setEditPhone(u.phone || '');
    setEditAvatar(u.avatar_url || '');
    setEditIsActive(u.is_active !== false);
    setEditPassword('');
    setEditUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resolvedRoleId = newUserRoleId || roles.find(r => r.name === newUserRole)?.id || null;
      await api.post('/auth/users', {
        username: newUsername.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        full_name: newUserFullName.trim(),
        role: newUserRole,
        role_id: resolvedRoleId,
        organization_id: newUserOrgId || null,
        phone: newUserPhone.trim() || null,
        avatar_url: newUserAvatar || null,
      });

      setAddUserModalOpen(false);
      loadData();
      // Reset
      setNewUsername('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserPhone('');
      setNewUserAvatar('');
      alert('User registered successfully with assigned role and organization!');
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const resolvedRoleId = editRoleId || roles.find(r => r.name === editRole)?.id || null;
      await api.put(`/auth/users/${selectedUser.id}`, {
        full_name: editFullName.trim(),
        role: editRole,
        role_id: resolvedRoleId,
        organization_id: editOrgId || null,
        phone: editPhone.trim() || null,
        avatar_url: editAvatar || null,
        is_active: editIsActive,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      });

      setEditUserModalOpen(false);
      loadData();
      alert('User details and role privileges updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchRole = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'ACCOUNTANT':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'SALES_STAFF':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'DELIVERY_COORDINATOR':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    }
  };

  const currentActiveRole = roles.find(r => r.id === activeRoleId);

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation Tabs */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Sub-tab 1: User Center / Profile */}
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'profile'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>User Center / Profile (ကိုယ်ပိုင် အကောင့်)</span>
          </button>

          {/* Sub-tab 2: Organization Settings */}
          <button
            onClick={() => setActiveSubTab('organizations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'organizations'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organization Settings ({organizations.length})</span>
          </button>

          {/* Sub-tab 3: Dynamic Roles Matrix */}
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'roles'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Dynamic Roles & Permissions ({roles.length})</span>
          </button>

          {/* Sub-tab 4: Users Accounts */}
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'users'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Users ({users.length})</span>
          </button>

          {/* Sub-tab 5: Audit Logs */}
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'audit'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Action button based on active sub tab */}
        <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
          {activeSubTab === 'organizations' && currentUser?.role === 'SYSADMIN' && (
            <button
              onClick={openAddOrgModal}
              className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Organization (Sysadmin)</span>
            </button>
          )}

          {activeSubTab === 'roles' && hasPermission('role:manage', currentUser) && (
            <button
              onClick={() => setAddRoleModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          )}

          {activeSubTab === 'users' && hasPermission('user:manage', currentUser) && (
            <button
              onClick={() => setAddUserModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New User</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUB-TAB 1: USER CENTER & MY PROFILE                                 */}
      {/* =================================================================== */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Profile Card with Avatar & Organization badge */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="text-center space-y-3">
              <div className="relative inline-block mx-auto">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-0.5 shadow-xl">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={fullName} 
                      className="w-full h-full object-cover rounded-2xl" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-3xl font-black text-brand-400">
                      {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-900" title="Online & Active" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{fullName || profile?.full_name || 'Syswind User'}</h3>
                <p className="text-xs font-mono text-slate-400">@{profile?.username || 'user'}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${roleBadgeStyle(profile?.role || 'SALES_STAFF')}`}>
                    {profile?.role ? profile.role.replace(/_/g, ' ') : 'Staff'}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                    {profile?.organization?.name || currentOrg?.name || 'Syswind Group'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Email Address:</span>
                <span className="text-slate-200 font-medium">{profile?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phone Number:</span>
                <span className="text-slate-200 font-mono">{phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Member Since:</span>
                <span className="text-slate-200 font-mono">{profile?.created_at ? formatDate(profile.created_at) : 'N/A'}</span>
              </div>
            </div>

            {/* Quick Upload Profile Photo */}
            <div className="pt-3 border-t border-slate-800">
              <ImageUpload
                label="Change Profile Avatar (ဓာတ်ပုံ တင်ရန်)"
                value={avatarUrl}
                onChange={setAvatarUrl}
              />
            </div>
          </div>

          {/* Right Column: Edit Profile Form & Change Password */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Edit Profile Information */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <UserIcon className="w-5 h-5 text-brand-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Personal Details & Bio (အချက်အလက် ပြင်ဆင်ခြင်း)
                </h4>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name (အမည် အပြည့်အစုံ) *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-brand-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      placeholder="09971234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Bio / Role Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Tell your team about your responsibilities or shift notes..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Change Password Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Security & Change Password (စကားဝှက် အသစ်လဲလှယ်ခြင်း)
                </h4>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Current Password (လက်ရှိ စကားဝှက်) *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">New Password (စကားဝှက် အသစ်) *</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordChanging}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-1.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{passwordChanging ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: ORGANIZATIONS MANAGEMENT                                 */}
      {/* =================================================================== */}
      {activeSubTab === 'organizations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map(org => {
              const isCurrent = currentOrg?.id === org.id;
              return (
                <div 
                  key={org.id} 
                  className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCurrent ? 'border-brand-500/50 bg-brand-950/20' : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {org.logo_url ? (
                            <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-6 h-6 text-brand-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{org.name}</h4>
                          <span className="font-mono text-[11px] text-brand-400 font-semibold">{org.code}</span>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full">
                          ACTIVE HQ
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5 text-xs mb-3">
                      {org.tax_number && (
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Reg / Tax No:</span>
                          <span className="font-mono">{org.tax_number}</span>
                        </div>
                      )}
                      {org.phone && (
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-mono">{org.phone}</span>
                        </div>
                      )}
                      {org.email && (
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Email:</span>
                          <span>{org.email}</span>
                        </div>
                      )}
                      {org.address && (
                        <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
                          {org.address}, {org.city || 'Yangon'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-400">
                      Users: <strong className="text-white">{org.user_count || 0}</strong>
                    </span>
                    <button
                      onClick={() => openEditOrgModal(org)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5 text-brand-400" />
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {organizations.length === 0 && (
            <div className="text-center py-12 glass-panel rounded-2xl border border-slate-800">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold text-sm">No organizations configured</p>
              <button
                onClick={openAddOrgModal}
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl"
              >
                Add Primary Organization
              </button>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 3: DYNAMIC ROLES & PERMISSIONS MATRIX                       */}
      {/* =================================================================== */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Roles Selector Sidebar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                System & Custom Roles ({roles.length})
              </h4>
              <button
                onClick={() => setAddRoleModalOpen(true)}
                className="p-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg"
                title="Create Role"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {roles.map(r => {
                const isSelected = r.id === activeRoleId;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs">{r.display_name}</span>
                        {r.is_system && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                            SYS
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.name}</p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full font-mono">
                        {r.permission_codes?.length || 0} perms
                      </span>
                      {!r.is_system && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(r.id, r.display_name);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          title="Delete role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permissions Matrix Detail & Configuration */}
          <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-brand-400" />
                  <h3 className="text-base font-bold text-white">
                    {currentActiveRole?.display_name || 'Select a Role'}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${roleBadgeStyle(currentActiveRole?.name || '')}`}>
                    {currentActiveRole?.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currentActiveRole?.description || 'Select which navigation menus and action buttons this role is granted.'}
                </p>
              </div>

              {hasPermission('role:manage', currentUser) && (
                <button
                  onClick={handleSaveRolePermissions}
                  disabled={roleSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{roleSaving ? 'Saving...' : 'Save Role Permissions'}</span>
                </button>
              )}
            </div>

            {/* Section 1: Navigation Menus Access */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>1. Navigation Menus Access (ဘယ် Menu တွေကို မြင်တွေ့ခွင့်ရမည်နည်း)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {selectedPermCodes.filter(c => c.startsWith('menu:')).length} of {menus.length} Menus Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {menus.map(menu => {
                  const checked = selectedPermCodes.includes(menu.code);
                  return (
                    <label 
                      key={menu.id || menu.code} 
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                        checked
                          ? 'bg-brand-600/15 border-brand-500/60 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermissionCode(menu.code)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 w-4 h-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{menu.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 block truncate">{menu.code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Action Buttons & Operations Access */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>2. Action Buttons & Operational Privileges (ဘယ်ခလုတ်တွေကို လုပ်ဆောင်ခွင့်ရမည်နည်း)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {selectedPermCodes.filter(c => !c.startsWith('menu:')).length} of {buttons.length} Buttons Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {buttons.map(btn => {
                  const checked = selectedPermCodes.includes(btn.code);
                  return (
                    <label 
                      key={btn.id || btn.code} 
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                        checked
                          ? 'bg-indigo-600/15 border-indigo-500/60 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermissionCode(btn.code)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{btn.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 block truncate">{btn.code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 4: STAFF & USERS ACCOUNTS                                   */}
      {/* =================================================================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
              <input
                type="text"
                placeholder="Search staff by Name, Username, Email, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Roles (ရာထူး အားလုံး)</option>
              {roles.map(r => (
                <option key={r.id} value={r.name}>{r.display_name} ({r.name})</option>
              ))}
            </select>

            <button onClick={loadData} className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Users Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px] border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 w-[24%] whitespace-nowrap">User Profile</th>
                    <th className="py-3.5 px-4 w-[20%] whitespace-nowrap">Contact & Email</th>
                    <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">Organization</th>
                    <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">Assigned Role</th>
                    <th className="py-3.5 px-4 w-[10%] text-center whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 w-[14%] text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600/30 to-indigo-600/30 border border-brand-500/30 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                            ) : (
                              u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">{u.full_name}</div>
                            <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-[11px] text-slate-300 whitespace-nowrap">{u.email}</div>
                        {u.phone && <div className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">{u.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span className="text-xs text-slate-300 font-medium">
                          {u.organization?.name || currentOrg?.name || 'Main HQ'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${roleBadgeStyle(u.role)}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        {u.is_active !== false ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 whitespace-nowrap">
                            <XCircle className="w-3 h-3" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1 mx-auto border border-slate-700 hover:border-slate-600 transition-colors whitespace-nowrap"
                        >
                          <Edit className="w-3.5 h-3.5 text-brand-400" />
                          <span>Edit & Role</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 5: SECURITY AUDIT TRAIL                                     */}
      {/* =================================================================== */}
      {activeSubTab === 'audit' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Immutable System Activity Audit Trail (စနစ်မှတ်တမ်း)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px] border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-[18%] whitespace-nowrap">Timestamp</th>
                  <th className="py-3.5 px-4 w-[18%] whitespace-nowrap">Operator</th>
                  <th className="py-3.5 px-4 w-[14%] whitespace-nowrap">Action</th>
                  <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">Entity</th>
                  <th className="py-3.5 px-4 w-[24%]">Details</th>
                  <th className="py-3.5 px-4 w-[10%] whitespace-nowrap">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                    <td className="py-3 px-4 align-middle text-slate-400 whitespace-nowrap">{formatDate(l.created_at)}</td>
                    <td className="py-3 px-4 align-middle font-sans font-semibold text-white whitespace-nowrap">
                      {l.user_full_name || l.username || 'System Engine'}
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-purple-300 border border-purple-500/20 whitespace-nowrap">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle text-slate-300 font-sans whitespace-nowrap">{l.entity_name}</td>
                    <td className="py-3 px-4 align-middle max-w-xs truncate text-slate-400" title={typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}>
                      {typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}
                    </td>
                    <td className="py-3 px-4 align-middle text-slate-500 whitespace-nowrap">{l.ip_address || '::1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODALS                                                              */}
      {/* =================================================================== */}

      {/* 1. Add Organization Modal */}
      {addOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Add New Organization (လုပ်ငန်းအသစ်ထည့်ရန်)</h3>
              </div>
              <button onClick={() => setAddOrgModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Syswind Retail Mandalay Branch"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unique Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SYS-MDY-01"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 uppercase font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="09971234567"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="contact@branch.syswind.com"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Business Address</label>
                <input
                  type="text"
                  placeholder="No. 123, 78th Street, Maha Aung Myay, Mandalay"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">State / Division</label>
                  <input
                    type="text"
                    value={orgState}
                    onChange={(e) => setOrgState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tax / Reg No</label>
                  <input
                    type="text"
                    placeholder="TAX-12345"
                    value={orgTaxNumber}
                    onChange={(e) => setOrgTaxNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <ImageUpload
                  label="Organization Logo / Brand Icon"
                  value={orgLogoUrl}
                  onChange={setOrgLogoUrl}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={orgSubmitting}
                  onClick={() => setAddOrgModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orgSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  {orgSubmitting ? 'Saving...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Organization Modal */}
      {editOrgModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Edit Organization ({selectedOrg.name})</h3>
              </div>
              <button onClick={() => setEditOrgModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unique Code *</label>
                  <input
                    type="text"
                    required
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 uppercase font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Business Address</label>
                <input
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">State / Division</label>
                  <input
                    type="text"
                    value={orgState}
                    onChange={(e) => setOrgState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tax / Reg No</label>
                  <input
                    type="text"
                    value={orgTaxNumber}
                    onChange={(e) => setOrgTaxNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <ImageUpload
                  label="Update Organization Logo"
                  value={orgLogoUrl}
                  onChange={setOrgLogoUrl}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={orgSubmitting}
                  onClick={() => setEditOrgModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orgSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  {orgSubmitting ? 'Updating...' : 'Save Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Custom Role Modal */}
      {addRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Create Custom Role (ရာထူးအသစ်)</h3>
              </div>
              <button onClick={() => setAddRoleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Role Code (e.g. INVENTORY_MANAGER) *</label>
                <input
                  type="text"
                  required
                  placeholder="INVENTORY_MANAGER"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 uppercase font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Display Title (e.g. Inventory Manager - ဂိုဒေါင်မှူး) *</label>
                <input
                  type="text"
                  required
                  placeholder="Inventory Manager (ဂိုဒေါင်မှူး)"
                  value={newRoleDisplayName}
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Role Description / Scope</label>
                <textarea
                  rows={3}
                  placeholder="Responsible for stocking, low-stock alerts and suppliers..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddRoleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add User Modal */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Register New Staff / User Account</h3>
              <button onClick={() => setAddUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Full Name (အမည် အပြည့်အစုံ) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ma Hnin Yu Wai"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Username (အသုံးပြုသူအမည်) *</label>
                  <input
                    type="text"
                    required
                    placeholder="hninyu"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 lowercase focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="hninyu@syswind.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="09798889900"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Assign Staff Role (ရာထူး) *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewUserRole(val);
                      const matched = roles.find(r => r.name === val);
                      if (matched) setNewUserRoleId(matched.id);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-brand-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.display_name} ({r.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Organization / Branch</label>
                  <select
                    value={newUserOrgId}
                    onChange={(e) => setNewUserOrgId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Default HQ Organization</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <ImageUpload
                  label="User Profile Picture / Avatar"
                  value={newUserAvatar}
                  onChange={setNewUserAvatar}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit User & Role Modal */}
      {editUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Edit User & Privileges</h3>
                <p className="text-xs text-slate-400">@{selectedUser.username} ({selectedUser.email})</p>
              </div>
              <button onClick={() => setEditUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold text-brand-400">Assigned Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditRole(val);
                      const matched = roles.find(r => r.name === val);
                      if (matched) setEditRoleId(matched.id);
                    }}
                    className="w-full bg-slate-950 border border-brand-500/50 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-brand-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.display_name} ({r.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Assigned Organization</label>
                  <select
                    value={editOrgId}
                    onChange={(e) => setEditOrgId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Default HQ Organization</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Account Active Status</label>
                <div className="flex items-center space-x-4 p-2.5 rounded-lg bg-slate-950 border border-slate-700">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-emerald-400 font-semibold">Active (ခွင့်ပြုထားသည်)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      className="text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-rose-400 font-semibold">Deactivated (ပိတ်ထားသည်)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reset Password (စကားဝှက်အသစ် ပြောင်းလဲလိုပါက ထည့်ပါ)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <ImageUpload
                  label="Update User Avatar Photo"
                  value={editAvatar}
                  onChange={setEditAvatar}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
