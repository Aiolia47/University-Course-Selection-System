import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: any;
}

export interface RolePermission {
  role: string;
  permissions: Permission[];
  totalPermissions: number;
}

export interface PermissionStats {
  permissionId: string;
  permissionName: string;
  resource: string;
  action: string;
  rolesAssigned: string[];
  roleCount: number;
}

interface PermissionState {
  permissions: Permission[];
  rolePermissions: RolePermission[];
  permissionStats: PermissionStats[];
  currentRolePermissions: RolePermission | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: PermissionState = {
  permissions: [],
  rolePermissions: [],
  permissionStats: [],
  currentRolePermissions: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchPermissionsAsync = createAsyncThunk(
  'permissions/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      return data.data.permissions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch permissions');
    }
  }
);

export const fetchRolePermissionsAsync = createAsyncThunk(
  'permissions/fetchRolePermissions',
  async (role: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/permissions/roles/${role}/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch role permissions');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch role permissions');
    }
  }
);

export const fetchAllRolePermissionsAsync = createAsyncThunk(
  'permissions/fetchAllRolePermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/permissions/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch all role permissions');
      }

      const data = await response.json();
      return data.data.roles;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch all role permissions');
    }
  }
);

export const fetchPermissionStatsAsync = createAsyncThunk(
  'permissions/fetchPermissionStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/permissions/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permission stats');
      }

      const data = await response.json();
      return data.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch permission stats');
    }
  }
);

export const assignPermissionsToRoleAsync = createAsyncThunk(
  'permissions/assignPermissionsToRole',
  async (
    { role, permissionIds }: { role: string; permissionIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/v1/permissions/roles/${role}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ permissionIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign permissions to role');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to assign permissions to role');
    }
  }
);

export const revokePermissionFromRoleAsync = createAsyncThunk(
  'permissions/revokePermissionFromRole',
  async (
    { role, permissionId }: { role: string; permissionId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/v1/permissions/roles/${role}/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke permission from role');
      }

      const data = await response.json();
      return { role, permissionId, ...data.data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to revoke permission from role');
    }
  }
);

export const replaceRolePermissionsAsync = createAsyncThunk(
  'permissions/replaceRolePermissions',
  async (
    { role, permissionIds }: { role: string; permissionIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/v1/permissions/roles/${role}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ permissionIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to replace role permissions');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to replace role permissions');
    }
  }
);

const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearPermissions: (state) => {
      state.permissions = [];
      state.rolePermissions = [];
      state.currentRolePermissions = null;
      state.permissionStats = [];
      state.lastUpdated = null;
    },
    updateLocalPermission: (state, action: PayloadAction<Permission>) => {
      const index = state.permissions.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.permissions[index] = action.payload;
      }
    },
    removePermissionFromRole: (state, action: PayloadAction<{ role: string; permissionId: string }>) => {
      const { role, permissionId } = action.payload;

      // Update role permissions
      const rolePermissionIndex = state.rolePermissions.findIndex(rp => rp.role === role);
      if (rolePermissionIndex !== -1) {
        state.rolePermissions[rolePermissionIndex].permissions =
          state.rolePermissions[rolePermissionIndex].permissions.filter(
            p => p.id !== permissionId
          );
        state.rolePermissions[rolePermissionIndex].totalPermissions =
          state.rolePermissions[rolePermissionIndex].permissions.length;
      }

      // Update current role permissions if it matches
      if (state.currentRolePermissions?.role === role) {
        state.currentRolePermissions.permissions =
          state.currentRolePermissions.permissions.filter(p => p.id !== permissionId);
        state.currentRolePermissions.totalPermissions =
          state.currentRolePermissions.permissions.length;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch permissions
      .addCase(fetchPermissionsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPermissionsAsync.fulfilled, (state, action: PayloadAction<Permission[]>) => {
        state.isLoading = false;
        state.permissions = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchPermissionsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch role permissions
      .addCase(fetchRolePermissionsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRolePermissionsAsync.fulfilled, (state, action: PayloadAction<RolePermission>) => {
        state.isLoading = false;
        state.currentRolePermissions = action.payload;

        // Update or add to role permissions list
        const index = state.rolePermissions.findIndex(rp => rp.role === action.payload.role);
        if (index !== -1) {
          state.rolePermissions[index] = action.payload;
        } else {
          state.rolePermissions.push(action.payload);
        }

        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchRolePermissionsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch all role permissions
      .addCase(fetchAllRolePermissionsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllRolePermissionsAsync.fulfilled, (state, action: PayloadAction<RolePermission[]>) => {
        state.isLoading = false;
        state.rolePermissions = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchAllRolePermissionsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch permission stats
      .addCase(fetchPermissionStatsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPermissionStatsAsync.fulfilled, (state, action: PayloadAction<PermissionStats[]>) => {
        state.isLoading = false;
        state.permissionStats = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchPermissionStatsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Assign permissions to role
      .addCase(assignPermissionsToRoleAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(assignPermissionsToRoleAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastUpdated = Date.now();
        state.error = null;
        // Note: You might want to refetch the updated permissions here
      })
      .addCase(assignPermissionsToRoleAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Revoke permission from role
      .addCase(revokePermissionFromRoleAsync.fulfilled, (state, action) => {
        const { role, permissionId } = action.payload;
        permissionSlice.caseReducers.removePermissionFromRole(state, action);
        state.lastUpdated = Date.now();
      })
      .addCase(revokePermissionFromRoleAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Replace role permissions
      .addCase(replaceRolePermissionsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(replaceRolePermissionsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastUpdated = Date.now();
        state.error = null;
        // Note: You might want to refetch the updated permissions here
      })
      .addCase(replaceRolePermissionsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setLoading,
  clearPermissions,
  updateLocalPermission,
  removePermissionFromRole,
} = permissionSlice.actions;

// Selectors
export const selectPermissions = (state: { permissions: PermissionState }) => state.permissions.permissions;
export const selectRolePermissions = (state: { permissions: PermissionState }) => state.permissions.rolePermissions;
export const selectCurrentRolePermissions = (state: { permissions: PermissionState }) => state.permissions.currentRolePermissions;
export const selectPermissionStats = (state: { permissions: PermissionState }) => state.permissions.permissionStats;
export const selectPermissionLoading = (state: { permissions: PermissionState }) => state.permissions.isLoading;
export const selectPermissionError = (state: { permissions: PermissionState }) => state.permissions.error;
export const selectPermissionLastUpdated = (state: { permissions: PermissionState }) => state.permissions.lastUpdated;

// Memoized selectors
export const selectPermissionsByResource = (resource: string) => (state: { permissions: PermissionState }) =>
  state.permissions.permissions.filter(permission => permission.resource === resource);

export const selectRolePermissionsByRole = (role: string) => (state: { permissions: PermissionState }) =>
  state.permissions.rolePermissions.find(rp => rp.role === role);

export default permissionSlice.reducer;