import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Support Desk</h1>
        <p className="text-xl text-muted-foreground">
          Get help from our support team or manage support tickets efficiently.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto"
          >
            Sign In
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => navigate("/auth?tab=signup")}
            className="w-full sm:w-auto"
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;