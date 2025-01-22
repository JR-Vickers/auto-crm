import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Support Desk</h1>
        <p className="text-muted-foreground max-w-md">
          Get help from our support team or manage support tickets efficiently.
        </p>
        <div className="space-x-4">
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </div>
    </div>
  );
};

export default Index;