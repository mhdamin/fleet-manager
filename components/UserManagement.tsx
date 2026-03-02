import React from 'react';
import { Plus, Edit2, Lock, Eye } from 'lucide-react';
import { User } from '../types';

const MOCK_USERS: User[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@company.com', role: 'Administrator', department: 'Administration', lastLogin: '2025-01-16 13:22', status: 'Active' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Manager', department: 'Operations', lastLogin: '2025-01-16 14:32', status: 'Active' },
  { id: '3', name: 'Mike Davis', email: 'mike.davis@company.com', role: 'Operator', department: 'Operations', lastLogin: '2025-01-16 14:15', status: 'Active' },
  { id: '4', name: 'Alex Thompson', email: 'alex.thompson@company.com', role: 'Operator', department: 'Customer Service', lastLogin: '2025-01-16 13:58', status: 'Active' },
];

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-500">Manage user accounts, roles, and permissions</p>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-gray-800">
          <Plus size={16} className="mr-2" /> Add New User
        </button>
      </div>

       {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
             <p className="text-xs text-gray-500">Total Users</p><p className="text-xl font-bold">24</p>
        </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
             <p className="text-xs text-gray-500">Active Users</p><p className="text-xl font-bold">18</p>
        </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
             <p className="text-xs text-gray-500">Administrators</p><p className="text-xl font-bold">3</p>
        </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
             <p className="text-xs text-gray-500">Pending Approval</p><p className="text-xl font-bold">2</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4 w-10"><input type="checkbox" /></th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
             <tbody className="divide-y divide-gray-100">
                {MOCK_USERS.map(user => (
                   <tr key={user.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-6 py-4"><input type="checkbox" /></td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold text-white
                            ${user.role === 'Administrator' ? 'bg-gray-800' : user.role === 'Manager' ? 'bg-gray-600' : 'bg-gray-400'}
                        `}>
                            {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.department}</td>
                      <td className="px-6 py-4 text-gray-500">{user.lastLogin}</td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
                            {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 text-gray-400">
                            <button className="hover:text-blue-600"><Edit2 size={16}/></button>
                            <button className="hover:text-gray-600"><Lock size={16}/></button>
                            <button className="hover:text-gray-600"><Eye size={16}/></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;