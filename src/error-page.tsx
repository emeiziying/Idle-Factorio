import Button from '@mui/material/Button';
import { useRouteError } from 'react-router-dom';

interface RouteError {
  data: string;
  error: {
    columnNumber: number;
    fileName: string;
    lineNumber: number;
    message: string;
    stack: string;
  };
  internal: boolean;
  status: number;
  statusText: string;
  message: string;
}

export default function ErrorPage() {
  const error = useRouteError() as RouteError;

  return (
    <div
      id="error-page"
      className="absolute flex h-full w-full flex-col justify-center p-10 text-center"
    >
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>

      <Button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
      >
        Clear Storeage
      </Button>
    </div>
  );
}
