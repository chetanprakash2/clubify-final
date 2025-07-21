import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">Clubify</span>
            </div>
            <Button onClick={handleSignIn} className="bg-primary hover:bg-blue-700 text-white px-6 py-2">
              Sign in with Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Modern Club <span className="text-primary">Management</span><br />Made Simple
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Streamline your club operations with announcements, events, tasks, meetings, and real-time communication. Perfect for schools, colleges, and organizations worldwide.
          </p>
          
          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="border border-gray-200">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <i className="fas fa-bullhorn text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Announcements</h3>
                <p className="text-gray-600">Keep members informed with targeted announcements and real-time notifications.</p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <i className="fas fa-video text-secondary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">Video Meetings</h3>
                <p className="text-gray-600">Host seamless video meetings with built-in WebRTC technology.</p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <i className="fas fa-tasks text-accent text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">Task Management</h3>
                <p className="text-gray-600">Organize daily tasks and track progress with intuitive dashboards.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
