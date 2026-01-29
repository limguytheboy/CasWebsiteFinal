import { Link } from 'react-router-dom';
import { Cookie, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <Cookie className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-xl text-muted-foreground">Oops! This page got eaten</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button className="w-full rounded-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
