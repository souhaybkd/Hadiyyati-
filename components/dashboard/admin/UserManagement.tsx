'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { createSupabaseClient } from '@/lib/supabase'
import { 
  Users, 
  Search, 
  MoreVertical, 
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  Eye,
  Ban,
  CheckCircle
} from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  role: string
  status: string
  created_at: string
  updated_at: string
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'banned'>('all')
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus, updated_at: new Date().toISOString() }
          : user
      ))
    } catch (err) {
      console.error('Error updating user status:', err)
      setError('Failed to update user status')
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, updated_at: new Date().toISOString() }
          : user
      ))
    } catch (err) {
      console.error('Error updating user role:', err)
      setError('Failed to update user role')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && user.status === statusFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'inactive':
        return <Badge variant="secondary"><UserX className="w-3 h-3 mr-1" />Inactive</Badge>
      case 'banned':
        return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Banned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
      case 'user':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />User</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-design-text-heading">User Management</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading users...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-design-text-heading">User Management</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={fetchUsers} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-design-text-heading">User Management</h1>
        <Badge variant="outline" className="text-sm">
          {filteredUsers.length} users
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Platform Users
          </CardTitle>
          <div className="flex gap-4 pt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </Button>
              <Button
                variant={statusFilter === 'banned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('banned')}
              >
                Banned
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-design-primary text-white flex items-center justify-center text-sm font-medium">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-design-text-heading">{user.full_name}</div>
                        <div className="text-sm text-design-text-muted">@{user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-design-text-muted">
                      <Calendar className="h-4 w-4" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Ban className="h-4 w-4 mr-1" />
                              Ban
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ban User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to ban {user.full_name}? This will prevent them from accessing the platform.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => updateUserStatus(user.id, 'banned')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Ban User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : user.status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatus(user.id, 'active')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatus(user.id, 'active')}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      
                      {user.role !== 'admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Shield className="h-4 w-4 mr-1" />
                              Make Admin
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to grant admin privileges to {user.full_name}? They will have full access to the admin panel.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => updateUserRole(user.id, 'admin')}
                              >
                                Grant Admin Access
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-design-text-muted">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 