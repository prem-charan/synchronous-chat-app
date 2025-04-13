import { userAppStore } from "@/store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Chat = () => {
  
  const {userInfo} = userAppStore();
  const navigate = useNavigate();
  useEffect(() => {
    if(!userInfo.profileSetup) {
      toast('Please setup profile to continue.');
      navigate("/profile");
    }
  }, [userInfo, navigate]);

  return (
    <div>
      Chat
    </div>
  )
}

export default Chat;
