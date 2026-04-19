// frontend-mobile/src/services/profileService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmployeeProfile {
    employee_id: number;
    name: string;
    email: string;
    contact: string;
    role: string;
    username: string;
    area_id?: number;
    area_name?: string;
    is_active: boolean;
}

export interface CustomerProfile {
    customer_id: number;
    name: string;
    email: string;
    contact: string;
    username: string;
    shop_name: string;
    address: string;
    city?: string;
    route_id?: number;
    route_name?: string;
    loyalty_points: number;
    loyalty_level_id: number;
    level_name?: string;
    discount_percentage?: number;
    credit_limit?: number;
    is_active: boolean;
}

// IMPORTANT: Only include fields that sales reps can update
export interface UpdateEmployeeData {
    name?: string;
    username?: string;
    contact?: string;
    // email is NOT included - sales reps cannot update email
}

export interface UpdateCustomerData {
    name?: string;
    email?: string;
    contact?: string;
    address?: string;
    shop_name?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

const profileService = {
    // Get current employee profile
    getEmployeeProfile: async (): Promise<EmployeeProfile> => {
        try {
            const response: any = await api.get('/auth/me');
            if (response.success && response.data) {
                // Also get area name if area_id exists
                let area_name = undefined;
                if (response.data.area_id) {
                    try {
                        const areaResponse: any = await api.get(`/delivery-areas/${response.data.area_id}`);
                        if (areaResponse.success && areaResponse.data) {
                            area_name = areaResponse.data.area_name;
                        }
                    } catch (error) {
                        console.log('Area not found');
                    }
                }

                const profile = {
                    ...response.data,
                    area_name: area_name || 'Not assigned'
                };

                // Update stored user data
                const currentUser = await AsyncStorage.getItem('user');
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const updatedUser = { ...user, ...profile };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }

                return profile;
            }
            throw new Error('Failed to fetch profile');
        } catch (error: any) {
            console.error('Get employee profile error:', error);
            throw error;
        }
    },

    // Get current customer profile
    getCustomerProfile: async (): Promise<CustomerProfile> => {
        try {
            const response: any = await api.get('/customer-auth/me');
            if (response.success && response.data) {
                // Get loyalty level details
                let level_name = undefined;
                let discount_percentage = undefined;
                if (response.data.loyalty_level_id) {
                    try {
                        const levelResponse: any = await api.get(`/loyalty-levels/${response.data.loyalty_level_id}`);
                        if (levelResponse.success && levelResponse.data) {
                            level_name = levelResponse.data.level_name;
                            discount_percentage = levelResponse.data.discount_percentage;
                        }
                    } catch (error) {
                        console.log('Loyalty level not found');
                    }
                }

                // Get route details if route_id exists
                let route_name = undefined;
                if (response.data.route_id) {
                    try {
                        const routeResponse: any = await api.get(`/delivery-routes/${response.data.route_id}`);
                        if (routeResponse.success && routeResponse.data) {
                            route_name = routeResponse.data.route_name;
                        }
                    } catch (error) {
                        console.log('Route not found');
                    }
                }

                const profile = {
                    ...response.data,
                    level_name: level_name || 'Blue',
                    discount_percentage: discount_percentage || 0,
                    route_name: route_name || 'Not assigned'
                };

                // Update stored user data
                const currentUser = await AsyncStorage.getItem('user');
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const updatedUser = { ...user, ...profile };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }

                return profile;
            }
            throw new Error('Failed to fetch profile');
        } catch (error: any) {
            console.error('Get customer profile error:', error);
            throw error;
        }
    },

    // Update employee profile - FIXED: employee_id goes in URL, not in body
    updateEmployeeProfile: async (employeeId: number, data: UpdateEmployeeData): Promise<EmployeeProfile> => {
        try {
            console.log('Updating employee profile:', { employeeId, data });

            const response: any = await api.put(`/employees/${employeeId}`, data);

            console.log('Update response:', response);

            if (response.success && response.data) {
                // Update stored user data
                const currentUser = await AsyncStorage.getItem('user');
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const updatedUser = { ...user, ...response.data };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }
                return response.data;
            }
            throw new Error(response.message || 'Failed to update profile');
        } catch (error: any) {
            console.error('Update employee profile error:', error);
            throw error;
        }
    },

    // Update customer profile 
    updateCustomerProfile: async (customerId: number, data: UpdateCustomerData): Promise<CustomerProfile> => {
        try {
            console.log('Updating customer profile:', { customerId, data });

            const response: any = await api.put(`/customers/${customerId}`, data);

            console.log('Update response:', response);

            if (response.success && response.data) {
                // Update stored user data
                const currentUser = await AsyncStorage.getItem('user');
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const updatedUser = { ...user, ...response.data };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }
                return response.data;
            }
            throw new Error(response.message || 'Failed to update profile');
        } catch (error: any) {
            console.error('Update customer profile error:', error);
            throw error;
        }
    },

    // Change password
    changePassword: async (data: ChangePasswordData): Promise<void> => {
        try {
            const response: any = await api.put('/auth/change-password', data);
            if (!response.success) {
                throw new Error(response.message || 'Failed to change password');
            }
        } catch (error: any) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    // Upload profile image
    uploadProfileImage: async (imageUri: string): Promise<string> => {
        const formData = new FormData();
        formData.append('profile_image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'profile.jpg',
        } as any);

        try {
            const response: any = await api.post('/auth/upload-profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.success && response.data.image_url) {
                const currentUser = await AsyncStorage.getItem('user');
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const updatedUser = { ...user, profile_image: response.data.image_url };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                }
                return response.data.image_url;
            }
            throw new Error('Failed to upload image');
        } catch (error: any) {
            console.error('Upload profile image error:', error);
            throw error;
        }
    },
};

export default profileService;