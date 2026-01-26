import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, User, Star, Trash2, Edit } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { roleService } from '../../services/roleService';

interface UserData {
    id: string;
    email: string;
    role: 'admin' | 'subscriber' | 'user';
    created_at: string;
    last_sign_in_at?: string;
}

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await supabaseService.getAllUsers();
            if (data) {
                // Map RPC result to UserData interface
                const mappedUsers: UserData[] = data.map((u: any) => ({
                    id: u.id,
                    email: u.email,
                    role: u.role as 'admin' | 'subscriber' | 'user',
                    created_at: u.created_at,
                    last_sign_in_at: u.last_sign_in_at
                }));
                setUsers(mappedUsers);
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));

            await supabaseService.updateUserRole(userId, newRole);
        } catch (error) {
            console.error("Erro ao atualizar role:", error);
            // Revert on error
            fetchUsers();
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'subscriber': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
            default: return 'bg-slate-700 text-slate-400 border-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-500" />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-teal-500"
                    >
                        <option value="all">Todos os Cargos</option>
                        <option value="admin">Administradores</option>
                        <option value="subscriber">Assinantes</option>
                        <option value="user">Usuários Grátis</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cargo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data Cadastro</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        Carregando usuários...
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                                    {user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm text-slate-200 font-medium">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                                                {user.role === 'admin' && <Shield className="w-3 h-3 inline mr-1" />}
                                                {user.role === 'subscriber' && <Star className="w-3 h-3 inline mr-1" />}
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRoleChange(user.id, user.role === 'subscriber' ? 'user' : 'subscriber')}
                                                    className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                                                    title="Alterar Cargo"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Bloquear Acesso"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
