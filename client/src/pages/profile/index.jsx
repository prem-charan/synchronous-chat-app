import { userAppStore } from "@/store"


const Profile = () => {
  const {userInfo} = userAppStore()
  return (
    <div>
      Profile
      <div>Email: {userInfo.email}</div>
    </div>
  )
}

export default Profile
