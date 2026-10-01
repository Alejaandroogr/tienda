import { Toaster as SonnerToaster } from 'sonner';

function Toaster() {
  return (
    <SonnerToaster
      className="store-toaster"
      position="top-right"
      offset={{ top: 84, right: 16 }}
      mobileOffset={{ top: 74, right: 12, left: 12 }}
      closeButton
      richColors
      theme="light"
      duration={3600}
      visibleToasts={4}
      toastOptions={{
        style: {
          fontFamily: 'Geist Variable, sans-serif',
          borderRadius: '10px',
          boxShadow: '0 6px 18px rgba(23, 37, 56, 0.12)',
        },
      }}
    />
  );
}

export { Toaster };
