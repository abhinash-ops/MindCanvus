import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Camera, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    }
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await updateProfile(data)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=fff&size=128`}
                  alt={user?.username}
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <button className="absolute bottom-4 right-4 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-gray-600">@{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="firstName"
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className="input pl-10"
                      placeholder="Enter your first name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="lastName"
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className="input pl-10"
                      placeholder="Enter your last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="email"
                    type="email"
                    value={user?.email}
                    disabled
                    className="input pl-10 bg-gray-50"
                    placeholder="Enter your email"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <div className="mt-6">
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="avatar"
                    type="url"
                    {...register('avatar')}
                    className="input pl-10"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  {...register('bio')}
                  rows={4}
                  className="input"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile
