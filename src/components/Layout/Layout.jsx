import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import UserHeader from './UserHeader';
import Footer from '../Common/Footer';
import './Layout.css';

const Layout = ({ children }) => {
  const [backgroundUrl, setBackgroundUrl] = useState('');
  
  // Use KPRCAS image as primary background
  const kprcasBackground = "https://kprcas.ac.in/file/wp-content/uploads/2024/12/kprcas-1536x684.jpg";
  const kprcasLogo = "https://kprcas.ac.in/file/wp-content/uploads/2020/08/cropped-COLLEGE-LOGO-UPDATE.jpg";
  useEffect(() => {
    // First, set the KPRCAS background
    setBackgroundUrl(kprcasBackground);
    
    // Optional: Still check for custom background in Supabase
    const loadCustomBackground = async () => {
      try {
        const { data } = supabase.storage
          .from('backgrounds')
          .getPublicUrl('voting-background.jpg');
        
        // Only use Supabase background if it exists and you want to override KPRCAS
        if (data?.publicUrl) {
          // Uncomment next line if you want Supabase to override KPRCAS image
          // setBackgroundUrl(data.publicUrl);
        }
      } catch (error) {
        console.log('Using default KPRCAS background');
      }
    };

    loadCustomBackground();
  }, []);

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative'
      }}
    >
        {/* Global Logo - Top Left */}
      <div className="global-logo">
        <img 
          src={kprcasLogo} 
          alt="KPRCAS Logo" 
          onClick={() => window.location.href = '/'} 
        />
      </div>
      
      {/* Global Title - Top Center */}
      <div className="global-title">
        <h1>KPRCAS SOCS VOTING SYSTEM</h1>
      </div>

      <UserHeader />
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          paddingBottom: '60px', // Add padding to account for footer
          zIndex: 1
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
{/* <Footer /> */}
    </div>
  );
};

export default Layout;





// import React, { useEffect, useState } from 'react';
// import { supabase } from '../../lib/supabase';

// const Layout = ({ children }) => {
//   const [backgroundUrl, setBackgroundUrl] = useState('');

//   useEffect(() => {
//     // Load background image from Supabase Storage
//     const loadBackground = async () => {
//       const { data } = supabase.storage
//         .from('backgrounds')
//         .getPublicUrl('voting-background.jpg');
      
//       if (data?.publicUrl) {
//         setBackgroundUrl(data.publicUrl);
//       }
//     };

//     loadBackground();
//   }, []);

//   return (
//     <div 
//       style={{
//         minHeight: '100vh',
//         backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//         backgroundAttachment: 'fixed',
//         position: 'relative'
//       }}
//     >
//       <div 
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           backgroundColor: 'rgba(0, 0, 0, 0.5)',
//           zIndex: 1
//         }}
//       />
//       <div style={{ position: 'relative', zIndex: 2 }}>
//         {children}
//       </div>
//     </div>
//   );
// };

// export default Layout;
