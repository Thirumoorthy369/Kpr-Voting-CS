import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import './Admin.css';

const ManageCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    study_info: '',
    role_id: '',
    photo: null,
    photo_url: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    fetchCandidates();
    fetchRoles();
  }, []);

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*, roles(name)')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setCandidates(data);
      console.log('Fetched candidates:', data);
    } else {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('order_index');
    
    if (!error) {
      setRoles(data);
    }
  };

  // Enhanced image optimization with square crop
  const optimizeImage = async (file) => {
    const targetSize = 400; // Square size for candidates
    const quality = 0.85;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Create square canvas
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          
          // Fill with white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetSize, targetSize);
          
          // Calculate dimensions to center and fit image
          let scale;
          let x = 0;
          let y = 0;
          let width = img.width;
          let height = img.height;
          
          // Calculate scale to cover the square (crop to fill)
          const scaleX = targetSize / width;
          const scaleY = targetSize / height;
          scale = Math.max(scaleX, scaleY);
          
          // Calculate new dimensions
          const newWidth = width * scale;
          const newHeight = height * scale;
          
          // Center the image
          x = (targetSize - newWidth) / 2;
          y = (targetSize - newHeight) / 2;
          
          // Draw the image
          ctx.drawImage(img, x, y, newWidth, newHeight);
          
          // Add subtle vignette for professional look (optional)
          const gradient = ctx.createRadialGradient(
            targetSize/2, targetSize/2, 0,
            targetSize/2, targetSize/2, targetSize/2
          );
          gradient.addColorStop(0.7, 'transparent');
          gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, targetSize, targetSize);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              const optimizedFile = new File(
                [blob], 
                `optimized_${file.name}`, 
                {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                }
              );
              
              console.log('Image optimization complete:');
              console.log('- Original:', (file.size / 1024).toFixed(2), 'KB');
              console.log('- Optimized:', (optimizedFile.size / 1024).toFixed(2), 'KB');
              console.log('- Dimensions:', targetSize + 'x' + targetSize, 'px');
              
              resolve(optimizedFile);
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  // Alternative: Create a smart crop that detects faces (simple center crop)
  const smartCropImage = async (file) => {
    const targetSize = 400;
    const quality = 0.85;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          
          // Smart crop - takes center square of image
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          
          // Draw cropped square
          ctx.drawImage(
            img,
            x, y,           // Start position in source
            size, size,     // Size to take from source
            0, 0,           // Position in canvas
            targetSize, targetSize  // Size in canvas
          );
          
          canvas.toBlob(
            (blob) => {
              const optimizedFile = new File(
                [blob], 
                `square_${file.name}`, 
                {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                }
              );
              
              resolve(optimizedFile);
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const uploadPhoto = async (file) => {
    try {
      setUploading(true);
      setUploadProgress('Processing image...');
      
      // Validate file
      if (!file) {
        throw new Error('No file selected');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB');
      }
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('File must be JPEG, PNG, or WebP');
      }
      
      // Always optimize images for consistent display
      let fileToUpload;
      try {
        // Use smart crop for square images
        fileToUpload = await smartCropImage(file);
        setUploadProgress('Image processed! Uploading...');
      } catch (error) {
        console.warn('Image processing failed, using original:', error);
        fileToUpload = file;
      }
      
      console.log('Uploading file:', {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type
      });
      
      // Create unique filename
      const fileExt = fileToUpload.name.split('.').pop().toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('candidate-photos')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);
      setUploadProgress('Getting image URL...');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('candidate-photos')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);
      
      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }
      
      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 2000);
      
      return publicUrl;
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
      setUploadProgress('');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = formData.photo_url;
      
      // Upload new photo if selected
      if (formData.photo) {
        const uploadedUrl = await uploadPhoto(formData.photo);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
          console.log('New photo URL:', photoUrl);
        } else {
          // Upload failed, but continue with existing URL if editing
          if (!editingId) {
            setLoading(false);
            return;
          }
        }
      }

      const candidateData = {
        name: formData.name.trim(),
        study_info: formData.study_info.trim(),
        role_id: formData.role_id,
        photo_url: photoUrl || null,
        votes: editingId ? undefined : 0 // Don't reset votes when editing
      };

      // Remove undefined values
      Object.keys(candidateData).forEach(key => 
        candidateData[key] === undefined && delete candidateData[key]
      );

      console.log('Saving candidate data:', candidateData);

      if (editingId) {
        const { error } = await supabase
          .from('candidates')
          .update(candidateData)
          .eq('id', editingId);
          
        if (error) throw error;
        console.log('Candidate updated successfully');
      } else {
        const { data, error } = await supabase
          .from('candidates')
          .insert([candidateData])
          .select();
          
        if (error) throw error;
        console.log('Candidate created successfully:', data);
      }

      resetForm();
      await fetchCandidates(); // Refresh the list
      alert(editingId ? 'Candidate updated!' : 'Candidate added!');
      
    } catch (error) {
      console.error('Error saving candidate:', error);
      alert(`Error saving candidate: ${error.message}`);
    }
    
    setLoading(false);
  };

  const handleEdit = (candidate) => {
    setFormData({
      name: candidate.name,
      study_info: candidate.study_info || '',
      role_id: candidate.role_id,
      photo_url: candidate.photo_url || '',
      photo: null
    });
    setEditingId(candidate.id);
    window.scrollTo(0, 0); // Scroll to form
  };

  const handleDelete = async (id) => {
    // Find the candidate to show their name in confirmation
    const candidate = candidates.find(c => c.id === id);
    
    if (!candidate) return;

    const confirmMessage = `Are you sure you want to delete "${candidate.name}"?\n\nThis will also delete:\n- All votes for this candidate (${candidate.votes || 0} votes)\n- All voting records\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      setLoading(true);
      try {
        // Show progress
        alert('Deleting candidate data... Please wait.');

        // Step 1: Delete all votes for this candidate
        const { error: votesError } = await supabase
          .from('votes')
          .delete()
          .eq('candidate_id', id);
        
        if (votesError && votesError.code !== 'PGRST116') { // PGRST116 = no rows to delete
          console.error('Error deleting votes:', votesError);
          throw new Error(`Failed to delete votes: ${votesError.message}`);
        }

        // Step 2: Delete from user_votes table
        const { error: userVotesError } = await supabase
          .from('user_votes')
          .delete()
          .eq('candidate_id', id);
        
        if (userVotesError && userVotesError.code !== 'PGRST116') {
          console.error('Error deleting user votes:', userVotesError);
          // Continue anyway as this might not have entries
        }

        // Step 3: Delete the candidate
        const { error: candidateError } = await supabase
          .from('candidates')
          .delete()
          .eq('id', id);
          
        if (candidateError) {
          throw new Error(`Failed to delete candidate: ${candidateError.message}`);
        }
        
        alert(`Successfully deleted "${candidate.name}" and all related data.`);
        await fetchCandidates(); // Refresh the list
        
      } catch (error) {
        console.error('Error in delete operation:', error);
        alert(`Error: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      study_info: '',
      role_id: '',
      photo: null,
      photo_url: ''
    });
    setEditingId(null);
    setUploadProgress('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview validation
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      setFormData({ ...formData, photo: file });
      console.log('File selected:', file.name);
    }
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Candidates</h2>
        <Link to="/admin" className="back-link">← Back to Dashboard</Link>
      </div>
      
      <form onSubmit={handleSubmit} className="candidate-form">
        <h3>{editingId ? 'Edit' : 'Add New'} Candidate</h3>
        
        <input
          type="text"
          placeholder="Candidate Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          maxLength={100}
        />
        
        <input
          type="text"
          placeholder="Study Info (e.g., 3rd Year Computer Science)"
          value={formData.study_info}
          onChange={(e) => setFormData({...formData, study_info: e.target.value})}
          maxLength={200}
        />
        
        <select
          value={formData.role_id}
          onChange={(e) => setFormData({...formData, role_id: e.target.value})}
          required
        >
          <option value="">Select Role</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        
        <div className="file-input-wrapper">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="file-input-label">
            {formData.photo ? formData.photo.name : 'Choose Photo (JPEG, PNG, WebP - Max 5MB)'}
          </label>
        </div>
        
        {uploadProgress && (
          <div className="upload-progress">{uploadProgress}</div>
        )}
        
        {formData.photo_url && !formData.photo && (
          <div className="current-photo">
            <img 
              src={formData.photo_url} 
              alt="Current" 
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=Error';
              }}
            />
            <p>Current photo</p>
          </div>
        )}
        
        <div className="form-buttons">
          <button type="submit" disabled={loading || uploading}>
            {uploading ? 'Uploading Photo...' : loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Candidate
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="cancel-btn">
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="candidates-section">
        <h3>Current Candidates ({candidates.length})</h3>
        {candidates.length === 0 ? (
          <p className="no-candidates-message">No candidates added yet. Add your first candidate above!</p>
        ) : (
          <div className="candidates-grid">
            {candidates.map(candidate => (
              <div key={candidate.id} className="candidate-card">
                <div className="candidate-image-container">
                  {candidate.photo_url ? (
                    <img 
                      src={candidate.photo_url} 
                      alt={candidate.name} 
                      className="candidate-photo"
                      onError={(e) => {
                        console.error('Image load error for:', candidate.name);
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="candidate-photo-placeholder" 
                    style={{ display: candidate.photo_url ? 'none' : 'flex' }}
                  >
                    {candidate.name.charAt(0)}
                  </div>
                </div>
                <div className="candidate-info">
                  <h3>{candidate.name}</h3>
                  <p className="study-info">{candidate.study_info || 'No info'}</p>
                  <p className="role-info">
                    <strong>Role:</strong> {candidate.roles?.name || 'Unknown'}
                  </p>
                  <p className="vote-count">
                    <strong>Votes:</strong> {candidate.votes || 0}
                  </p>
                </div>
                <div className="candidate-actions">
                  <button onClick={() => handleEdit(candidate)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(candidate.id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCandidates;



// import React, { useState, useEffect } from 'react';
// import { supabase } from '../../lib/supabase';
// import { Link } from 'react-router-dom';
// import './Admin.css';

// const ManageCandidates = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [roles, setRoles] = useState([]);
//   const [formData, setFormData] = useState({
//     name: '',
//     study_info: '',
//     role_id: '',
//     photo: null,
//     photo_url: ''
//   });
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState('');

//   useEffect(() => {
//     fetchCandidates();
//     fetchRoles();
//   }, []);

//   const fetchCandidates = async () => {
//     const { data, error } = await supabase
//       .from('candidates')
//       .select('*, roles(name)')
//       .order('created_at', { ascending: false });
    
//     if (!error) {
//       setCandidates(data);
//       console.log('Fetched candidates:', data);
//     } else {
//       console.error('Error fetching candidates:', error);
//     }
//   };

//   const fetchRoles = async () => {
//     const { data, error } = await supabase
//       .from('roles')
//       .select('*')
//       .order('order_index');
    
//     if (!error) {
//       setRoles(data);
//     }
//   };

//   const uploadPhoto = async (file) => {
//     try {
//       setUploading(true);
//       setUploadProgress('Preparing upload...');
      
//       // Validate file
//       if (!file) {
//         throw new Error('No file selected');
//       }
      
//       if (file.size > 5 * 1024 * 1024) { // 5MB limit
//         throw new Error('File size must be less than 5MB');
//       }
      
//       const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
//       if (!validTypes.includes(file.type)) {
//         throw new Error('File must be JPEG, PNG, or WebP');
//       }
      
//       console.log('Uploading file:', {
//         name: file.name,
//         size: file.size,
//         type: file.type
//       });
      
//       setUploadProgress('Uploading image...');
      
//       // Create unique filename
//       const fileExt = file.name.split('.').pop().toLowerCase();
//       const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
//       // Upload to Supabase Storage
//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from('candidate-photos')
//         .upload(fileName, file, {
//           cacheControl: '3600',
//           upsert: false
//         });

//       if (uploadError) {
//         throw uploadError;
//       }

//       console.log('Upload successful:', uploadData);
//       setUploadProgress('Getting image URL...');

//       // Get public URL
//       const { data: { publicUrl } } = supabase.storage
//         .from('candidate-photos')
//         .getPublicUrl(fileName);

//       console.log('Generated public URL:', publicUrl);
      
//       if (!publicUrl) {
//         throw new Error('Failed to generate public URL');
//       }
      
//       setUploadProgress('Upload complete!');
//       setTimeout(() => setUploadProgress(''), 2000);
      
//       return publicUrl;
      
//     } catch (error) {
//       console.error('Upload error:', error);
//       alert(`Upload failed: ${error.message}`);
//       setUploadProgress('');
//       return null;
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       let photoUrl = formData.photo_url;
      
//       // Upload new photo if selected
//       if (formData.photo) {
//         const uploadedUrl = await uploadPhoto(formData.photo);
//         if (uploadedUrl) {
//           photoUrl = uploadedUrl;
//           console.log('New photo URL:', photoUrl);
//         } else {
//           // Upload failed, but continue with existing URL if editing
//           if (!editingId) {
//             setLoading(false);
//             return;
//           }
//         }
//       }

//       const candidateData = {
//         name: formData.name.trim(),
//         study_info: formData.study_info.trim(),
//         role_id: formData.role_id,
//         photo_url: photoUrl || null,
//         votes: editingId ? undefined : 0 // Don't reset votes when editing
//       };

//       // Remove undefined values
//       Object.keys(candidateData).forEach(key => 
//         candidateData[key] === undefined && delete candidateData[key]
//       );

//       console.log('Saving candidate data:', candidateData);

//       if (editingId) {
//         const { error } = await supabase
//           .from('candidates')
//           .update(candidateData)
//           .eq('id', editingId);
          
//         if (error) throw error;
//         console.log('Candidate updated successfully');
//       } else {
//         const { data, error } = await supabase
//           .from('candidates')
//           .insert([candidateData])
//           .select();
          
//         if (error) throw error;
//         console.log('Candidate created successfully:', data);
//       }

//       resetForm();
//       await fetchCandidates(); // Refresh the list
//       alert(editingId ? 'Candidate updated!' : 'Candidate added!');
      
//     } catch (error) {
//       console.error('Error saving candidate:', error);
//       alert(`Error saving candidate: ${error.message}`);
//     }
    
//     setLoading(false);
//   };

//   const handleEdit = (candidate) => {
//     setFormData({
//       name: candidate.name,
//       study_info: candidate.study_info || '',
//       role_id: candidate.role_id,
//       photo_url: candidate.photo_url || '',
//       photo: null
//     });
//     setEditingId(candidate.id);
//     window.scrollTo(0, 0); // Scroll to form
//   };

//  const handleDelete = async (id) => {
//   // Find the candidate to show their name in confirmation
//   const candidate = candidates.find(c => c.id === id);
  
//   if (!candidate) return;

//   const confirmMessage = `Are you sure you want to delete "${candidate.name}"?\n\nThis will also delete:\n- All votes for this candidate (${candidate.votes || 0} votes)\n- All voting records\n\nThis action cannot be undone.`;

//   if (window.confirm(confirmMessage)) {
//     setLoading(true);
//     try {
//       // Show progress
//       alert('Deleting candidate data... Please wait.');

//       // Step 1: Delete all votes for this candidate
//       const { error: votesError } = await supabase
//         .from('votes')
//         .delete()
//         .eq('candidate_id', id);
      
//       if (votesError && votesError.code !== 'PGRST116') { // PGRST116 = no rows to delete
//         console.error('Error deleting votes:', votesError);
//         throw new Error(`Failed to delete votes: ${votesError.message}`);
//       }

//       // Step 2: Delete from user_votes table
//       const { error: userVotesError } = await supabase
//         .from('user_votes')
//         .delete()
//         .eq('candidate_id', id);
      
//       if (userVotesError && userVotesError.code !== 'PGRST116') {
//         console.error('Error deleting user votes:', userVotesError);
//         // Continue anyway as this might not have entries
//       }

//       // Step 3: Delete the candidate
//       const { error: candidateError } = await supabase
//         .from('candidates')
//         .delete()
//         .eq('id', id);
        
//       if (candidateError) {
//         throw new Error(`Failed to delete candidate: ${candidateError.message}`);
//       }
      
//       alert(`Successfully deleted "${candidate.name}" and all related data.`);
//       await fetchCandidates(); // Refresh the list
      
//     } catch (error) {
//       console.error('Error in delete operation:', error);
//       alert(`Error: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
//     } finally {
//       setLoading(false);
//     }
//   }
// };


//   const resetForm = () => {
//     setFormData({
//       name: '',
//       study_info: '',
//       role_id: '',
//       photo: null,
//       photo_url: ''
//     });
//     setEditingId(null);
//     setUploadProgress('');
//   };

//   const handleFileSelect = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // Preview validation
//       if (file.size > 5 * 1024 * 1024) {
//         alert('File size must be less than 5MB');
//         e.target.value = '';
//         return;
//       }
      
//       setFormData({ ...formData, photo: file });
//       console.log('File selected:', file.name);
//     }
//   };

//   return (
//     <div className="manage-container">
//       <div className="manage-header">
//         <h2>Manage Candidates</h2>
//         <Link to="/admin" className="back-link">← Back to Dashboard</Link>
//       </div>
      
//       <form onSubmit={handleSubmit} className="candidate-form">
//         <h3>{editingId ? 'Edit' : 'Add New'} Candidate</h3>
        
//         <input
//           type="text"
//           placeholder="Candidate Name"
//           value={formData.name}
//           onChange={(e) => setFormData({...formData, name: e.target.value})}
//           required
//           maxLength={100}
//         />
        
//         <input
//           type="text"
//           placeholder="Study Info (e.g., 3rd Year Computer Science)"
//           value={formData.study_info}
//           onChange={(e) => setFormData({...formData, study_info: e.target.value})}
//           maxLength={200}
//         />
        
//         <select
//           value={formData.role_id}
//           onChange={(e) => setFormData({...formData, role_id: e.target.value})}
//           required
//         >
//           <option value="">Select Role</option>
//           {roles.map(role => (
//             <option key={role.id} value={role.id}>{role.name}</option>
//           ))}
//         </select>
        
//         <div className="file-input-wrapper">
//           <input
//             type="file"
//             accept="image/jpeg,image/jpg,image/png,image/webp"
//             onChange={handleFileSelect}
//             id="photo-upload"
//           />
//           <label htmlFor="photo-upload" className="file-input-label">
//             {formData.photo ? formData.photo.name : 'Choose Photo (JPEG, PNG, WebP - Max 5MB)'}
//           </label>
//         </div>
        
//         {uploadProgress && (
//           <div className="upload-progress">{uploadProgress}</div>
//         )}
        
//         {formData.photo_url && !formData.photo && (
//           <div className="current-photo">
//             <img 
//               src={formData.photo_url} 
//               alt="Current" 
//               onError={(e) => {
//                 e.target.src = 'https://via.placeholder.com/150?text=Error';
//               }}
//             />
//             <p>Current photo</p>
//           </div>
//         )}
        
//         <div className="form-buttons">
//           <button type="submit" disabled={loading || uploading}>
//             {uploading ? 'Uploading Photo...' : loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Candidate
//           </button>
//           {editingId && (
//             <button type="button" onClick={resetForm} className="cancel-btn">
//               Cancel Edit
//             </button>
//           )}
//         </div>
//       </form>

//       <div className="candidates-section">
//         <h3>Current Candidates ({candidates.length})</h3>
//         {candidates.length === 0 ? (
//           <p className="no-candidates-message">No candidates added yet. Add your first candidate above!</p>
//         ) : (
//           <div className="candidates-grid">
//             {candidates.map(candidate => (
//               <div key={candidate.id} className="candidate-card">
//                 <div className="candidate-image-container">
//                   {candidate.photo_url ? (
//                     <img 
//                       src={candidate.photo_url} 
//                       alt={candidate.name} 
//                       className="candidate-photo"
//                       onError={(e) => {
//                         console.error('Image load error for:', candidate.name);
//                         e.target.style.display = 'none';
//                         e.target.nextElementSibling.style.display = 'flex';
//                       }}
//                     />
//                   ) : null}
//                   <div 
//                     className="candidate-photo-placeholder" 
//                     style={{ display: candidate.photo_url ? 'none' : 'flex' }}
//                   >
//                     {candidate.name.charAt(0)}
//                   </div>
//                 </div>
//                 <div className="candidate-info">
//                   <h3>{candidate.name}</h3>
//                   <p className="study-info">{candidate.study_info || 'No info'}</p>
//                   <p className="role-info">
//                     <strong>Role:</strong> {candidate.roles?.name || 'Unknown'}
//                   </p>
//                   <p className="vote-count">
//                     <strong>Votes:</strong> {candidate.votes || 0}
//                   </p>
//                 </div>
//                 <div className="candidate-actions">
//                   <button onClick={() => handleEdit(candidate)} className="edit-btn">
//                     Edit
//                   </button>
//                   <button onClick={() => handleDelete(candidate.id)} className="delete-btn">
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ManageCandidates;




