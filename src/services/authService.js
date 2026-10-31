export const findAccount=(users,email,password)=>users.find(u=>u.email.toLowerCase()===email.trim().toLowerCase()&&u.password===password);
export const publicRoles=['donor','organization','volunteer'];
