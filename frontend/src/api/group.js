import api from './auth'

export const createGroup    = (data)           => api.post('/groups', data)
export const getMyGroups    = ()               => api.get('/groups')
export const getGroup       = (id)             => api.get(`/groups/${id}`)
export const updateGroup    = (id, data)       => api.put(`/groups/${id}`, data)
export const uploadGroupAvatar = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/groups/${id}/avatar`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const addMember      = (id, userId)     => api.post(`/groups/${id}/members/${userId}`)
export const removeMember   = (id, userId)     => api.delete(`/groups/${id}/members/${userId}`)
export const transferAdmin  = (id, userId)     => api.put(`/groups/${id}/admin/${userId}`)
export const leaveGroup     = (id)             => api.delete(`/groups/${id}/leave`)
export const deleteGroup    = (id)             => api.delete(`/groups/${id}`)
export const acceptInvite   = (id)             => api.post(`/groups/${id}/accept-invite`)
export const declineInvite  = (id)             => api.post(`/groups/${id}/decline-invite`)