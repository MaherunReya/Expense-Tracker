import React from 'react'

const UserProfileCard = ({user}) => {
  return (
    <div>
        <h1>{user.name}</h1>
        <h1>{user.age}</h1>
    </div>
  )
}

export default UserProfileCard