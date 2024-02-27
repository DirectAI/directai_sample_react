import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

function PhotoUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null); // Store the image file
  const [tlbrs, setTlbrs] = useState(null); // Store the TLBR array
  const canvasRef = useRef(null); // Reference to the canvas element

  useEffect(() => {
    if (canvasRef.current && selectedImage && tlbrs) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Resize canvas to match image dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        // Draw the image
        ctx.drawImage(img, 0, 0);
        // Draw the bounding box
        tlbrs.forEach((box) => {
            const [x1, y1, x2, y2] = box.tlbr;
            ctx.beginPath();
            ctx.strokeStyle = stringToColor(box.class);
            ctx.lineWidth = 2;
            ctx.rect(x1, y1, x2 - x1, y2 - y1);
            ctx.stroke();

            // Set the style for the text
            ctx.fillStyle = stringToColor(box.class); // Use the same color as the box or choose a different one
            ctx.font = '16px Arial'; // Set the font size and family
            ctx.fillText(box.class, x1, y1 - 5);
        });
      };
      img.src = selectedImage;
    }
  }, [selectedImage, tlbrs]); // Redraw when selectedImage or tlbr changes

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      let img = e.target.files[0];
      setSelectedImage(URL.createObjectURL(img));

      try {
        // Prepare the file data for the API request
        const formData = new FormData();
        formData.append('data', img);

        // // Make the POST request
        const url = 'http://localhost:5000/detect';
        const response = await axios.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            // Include other headers if necessary
          }
        });
        const detections = response.data[0];
        const firstDetectionTLBR = response.data[0][0].tlbr;
        console.log(firstDetectionTLBR);
        setTlbrs(detections); // Store the TLBR array for drawing
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {selectedImage && (
        <div>
          <h2>Preview:</h2>
          <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }}></canvas>
        </div>
      )}
    </div>
  );
}

export default PhotoUpload;
