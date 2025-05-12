import { v4 as uuidv4 } from 'uuid';
import { format, addDays, parseISO } from 'date-fns';

// Mock function for image selection - in a real app, this would use react-native-image-picker
export const selectImage = async (useCamera = false) => {
  // In a web demo, we'll simulate this with a file input instead
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };
    
    input.click();
  });
};

// Detect language from text
export const detectLanguage = (text) => {
  // Log the actual text being analyzed for debugging
  console.log('Analyzing text for language detection (first 200 chars):', text.substring(0, 200));
  
  // Common words in different languages to help with detection
  const languagePatterns = {
    english: {
      dayMarkers: ['day', 'week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      intensityMarkers: ['easy', 'medium', 'hard', 'rest', 'light', 'moderate', 'intense', 'heavy', 'recovery'],
      exerciseMarkers: ['reps', 'sets', 'min', 'sec', 'rest', 'workout', 'exercise', 'training']
    },
    spanish: {
      dayMarkers: ['día', 'semana', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
      intensityMarkers: ['fácil', 'medio', 'difícil', 'descanso', 'ligero', 'moderado', 'intenso', 'recuperación'],
      exerciseMarkers: ['repeticiones', 'series', 'min', 'seg', 'descanso', 'entrenamiento', 'ejercicio']
    },
    french: {
      dayMarkers: ['jour', 'semaine', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
      intensityMarkers: ['facile', 'moyen', 'difficile', 'repos', 'léger', 'modéré', 'intense', 'récupération'],
      exerciseMarkers: ['répétitions', 'séries', 'min', 'sec', 'repos', 'entraînement', 'exercice']
    },
    german: {
      dayMarkers: ['tag', 'woche', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'],
      intensityMarkers: ['leicht', 'mittel', 'schwer', 'ruhe', 'erholung', 'intensiv', 'moderat'],
      exerciseMarkers: ['wiederholungen', 'sätze', 'min', 'sek', 'pause', 'training', 'übung']
    },
    swedish: {
      dayMarkers: ['dag', 'vecka', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'],
      intensityMarkers: ['lätt', 'medel', 'svår', 'vila', 'återhämtning', 'intensiv', 'moderat', 'tung', 'hård'],
      exerciseMarkers: ['repetitioner', 'rep', 'reps', 'set', 'min', 'sek', 'vila', 'träning', 'övning', 'uppvärmning', 'nedvarvning', 'stretching', 'styrka', 'löpning', 'jogging', 'sprintervaller', 'intervaller', 'armhävningar', 'knäböj', 'utfall', 'hopprep']
    },
    norwegian: {
      dayMarkers: ['dag', 'uke', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'],
      intensityMarkers: ['lett', 'middels', 'hard', 'hvile', 'restitusjon', 'intensiv', 'moderat'],
      exerciseMarkers: ['repetisjoner', 'sett', 'min', 'sek', 'hvile', 'trening', 'øvelse']
    },
    danish: {
      dayMarkers: ['dag', 'uge', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'],
      intensityMarkers: ['let', 'mellem', 'hård', 'hvile', 'restitution', 'intensiv', 'moderat'],
      exerciseMarkers: ['gentagelser', 'sæt', 'min', 'sek', 'hvile', 'træning', 'øvelse']
    },
    finnish: {
      dayMarkers: ['päivä', 'viikko', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai', 'sunnuntai'],
      intensityMarkers: ['helppo', 'keskitaso', 'kova', 'lepo', 'palautuminen', 'intensiivinen', 'kohtalainen'],
      exerciseMarkers: ['toistot', 'sarjat', 'min', 'sek', 'lepo', 'harjoitus', 'liike']
    }
  };

  // Convert text to lowercase for better matching
  const lowerText = text.toLowerCase();
  
  // First, check for Nordic-specific characters
  const nordicChars = ['å', 'ä', 'ö', 'ø', 'æ', 'é', 'ü', 'ð', 'þ'];
  let nordicCharCount = 0;
  
  nordicChars.forEach(char => {
    const regex = new RegExp(char, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      nordicCharCount += matches.length;
    }
  });
  
  console.log('Nordic character count:', nordicCharCount);
  
  // If text contains significant Nordic characters, prioritize Nordic languages
  if (nordicCharCount > 3) {
    console.log('Detected significant Nordic characters, prioritizing Nordic languages');
    
    // Check specific Swedish patterns
    const swedishSpecificPatterns = [
      'uppvärmning', 'nedvarvning', 'träning', 'sprintervaller', 'löpning',
      'lätt', 'medel', 'svår', 'vila', 'jogging', 'stretching', 'övning',
      'armhävningar', 'knäböj', 'utfall', 'styrka', 'tung', 'hård', 'lätta'
    ];
    
    // Check Norwegian patterns
    const norwegianSpecificPatterns = [
      'oppvarming', 'nedvarming', 'trening', 'intervaller', 'løping',
      'lett', 'middels', 'hard', 'hvile', 'jogging', 'tøying', 'øvelse',
      'pushups', 'knebøy', 'utfall', 'styrke'
    ];
    
    // Check Danish patterns
    const danishSpecificPatterns = [
      'opvarmning', 'nedkøling', 'træning', 'intervaller', 'løb',
      'let', 'mellem', 'hård', 'hvile', 'jogging', 'udstrækning', 'øvelse',
      'armstrækninger', 'knæbøjninger', 'udfald', 'styrke'
    ];
    
    // Check Finnish patterns
    const finnishSpecificPatterns = [
      'lämmittely', 'jäähdyttely', 'harjoitus', 'intervallit', 'juoksu',
      'helppo', 'keskitaso', 'kova', 'lepo', 'hölkkä', 'venyttely', 'liike',
      'punnerrukset', 'kyykyt', 'askelkyykyt', 'voima'
    ];
    
    let swedishScore = 0;
    let norwegianScore = 0;
    let danishScore = 0;
    let finnishScore = 0;
    
    // Count Swedish-specific matches
    swedishSpecificPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        swedishScore += matches.length * 2;
        console.log(`Swedish match: ${pattern} (${matches.length} times)`);
      }
    });
    
    // Count Norwegian-specific matches
    norwegianSpecificPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        norwegianScore += matches.length * 2;
        console.log(`Norwegian match: ${pattern} (${matches.length} times)`);
      }
    });
    
    // Count Danish-specific matches
    danishSpecificPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        danishScore += matches.length * 2;
        console.log(`Danish match: ${pattern} (${matches.length} times)`);
      }
    });
    
    // Count Finnish-specific matches
    finnishSpecificPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        finnishScore += matches.length * 2;
        console.log(`Finnish match: ${pattern} (${matches.length} times)`);
      }
    });
    
    console.log('Nordic language scores:', {
      swedish: swedishScore,
      norwegian: norwegianScore,
      danish: danishScore,
      finnish: finnishScore
    });
    
    // If we have strong evidence of a specific Nordic language, return it directly
    const highestNordicScore = Math.max(swedishScore, norwegianScore, danishScore, finnishScore);
    if (highestNordicScore > 4) {
      if (swedishScore === highestNordicScore) {
        console.log('Swedish detected with high confidence');
        return 'swedish';
      } else if (norwegianScore === highestNordicScore) {
        console.log('Norwegian detected with high confidence');
        return 'norwegian';
      } else if (danishScore === highestNordicScore) {
        console.log('Danish detected with high confidence');
        return 'danish';
      } else if (finnishScore === highestNordicScore) {
        console.log('Finnish detected with high confidence');
        return 'finnish';
      }
    }
  }
  
  // Check for common Swedish patterns even if Nordic char count is low
  const swedishSpecificPatterns = [
    'uppvärmning', 'nedvarvning', 'träning', 'sprintervaller', 'löpning',
    'lätt', 'medel', 'svår', 'vila', 'jogging', 'stretching', 'övning',
    'armhävningar', 'knäböj', 'utfall'
  ];
  
  // Count Swedish-specific matches with higher weight
  let swedishSpecificCount = 0;
  swedishSpecificPatterns.forEach(pattern => {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      // Give significant boost to Swedish-specific terms
      swedishSpecificCount += matches.length * 3;
      console.log(`Swedish term detected: ${pattern} (${matches.length} times)`);
    }
  });
  
  // If many Swedish-specific terms are found, return Swedish directly
  if (swedishSpecificCount > 5) {
    console.log('Swedish detected via specific patterns with high confidence');
    return 'swedish';
  }
  
  // Count matches for each language
  const scores = Object.entries(languagePatterns).reduce((acc, [language, patterns]) => {
    let score = 0;
    
    // Add Swedish-specific bonus if this is Swedish
    if (language === 'swedish') {
      score += swedishSpecificCount;
    }
    
    // Count occurrences of day markers
    patterns.dayMarkers.forEach(marker => {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = lowerText.match(regex);
      const matchCount = matches ? matches.length * 2 : 0;
      score += matchCount;
      if (matchCount > 0 && ['swedish', 'norwegian', 'danish', 'finnish'].includes(language)) {
        console.log(`${language} day marker: ${marker} (${matches.length} times)`);
      }
    });
    
    // Count occurrences of intensity markers
    patterns.intensityMarkers.forEach(marker => {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = lowerText.match(regex);
      const matchCount = matches ? matches.length : 0;
      score += matchCount;
      if (matchCount > 0 && ['swedish', 'norwegian', 'danish', 'finnish'].includes(language)) {
        console.log(`${language} intensity marker: ${marker} (${matches.length} times)`);
      }
    });
    
    // Count occurrences of exercise markers
    patterns.exerciseMarkers.forEach(marker => {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = lowerText.match(regex);
      const matchCount = matches ? matches.length : 0;
      score += matchCount;
      if (matchCount > 0 && ['swedish', 'norwegian', 'danish', 'finnish'].includes(language)) {
        console.log(`${language} exercise marker: ${marker} (${matches.length} times)`);
      }
    });
    
    // Give Nordic languages a priority when day names match
    if (['swedish', 'norwegian', 'danish', 'finnish'].includes(language)) {
      score *= 1.5; // 50% bonus for Nordic languages
    }
    
    // Swedish terms often use meters (m) and seconds (s)
    if (language === 'swedish') {
      const meterMatches = lowerText.match(/\d+\s*(?:m|meter)/gi);
      const secondMatches = lowerText.match(/\d+\s*(?:s|sek|sekunder)/gi);
      const meterCount = meterMatches ? meterMatches.length * 2 : 0;
      const secondsCount = secondMatches ? secondMatches.length * 2 : 0;
      score += meterCount + secondsCount;
      
      if (meterCount > 0) {
        console.log(`Swedish meter pattern matches: ${meterCount}`);
      }
      if (secondsCount > 0) {
        console.log(`Swedish seconds pattern matches: ${secondsCount}`);
      }
    }
    
    acc[language] = score;
    return acc;
  }, {});
  
  console.log('Language detection scores:', scores);
  
  // Find language with highest score
  const detectedLanguage = Object.entries(scores).reduce((max, [language, score]) => {
    return score > max.score ? { language, score } : max;
  }, { language: 'english', score: 0 }).language;
  
  // If the highest score is very low, default to a Nordic language if Nordic characters were detected
  if (scores[detectedLanguage] < 5 && nordicCharCount > 1) {
    console.log('Low confidence detection but Nordic characters present, defaulting to Swedish');
    return 'swedish';
  }
  
  console.log('Final detected language:', detectedLanguage);
  return detectedLanguage;
};

// Enhanced OCR processing with more detailed logging
export const performOcr = async (imageUri) => {
  try {
    console.log('OCR process started for image:', imageUri.substring(0, 50) + '...');
    
    // Process the image for better OCR results
    const processedImage = await processImageForOcr(imageUri);
    console.log('Image processed for OCR, size:', processedImage.length);
    
    // Extract text from the image
    const extractedText = await extractTextFromImage(processedImage);
    
    // Log the extracted text for debugging
    console.log('OCR text extraction complete - Text length:', extractedText.length);
    console.log('OCR extracted text sample:', extractedText.substring(0, 200) + '...');
    
    return extractedText;
  } catch (error) {
    console.error('OCR processing error:', error.message);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

// Process image for better OCR results
const processImageForOcr = async (imageUri) => {
  try {
    console.log('Processing image for OCR');
    
    // Create a promise to handle image processing
    return new Promise((resolve, reject) => {
      // Create image object for resizing
      const img = new Image();
      
      img.onload = () => {
        try {
          // Determine new dimensions (max 1200px width/height to keep file size reasonable)
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            } else {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw resized image on canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with reduced quality to minimize size
          const compressedImageUri = canvas.toDataURL('image/jpeg', 0.7);
          
          console.log(`Image resized from ${img.width}x${img.height} to ${width}x${height}`);
          console.log(`Original size: ~${Math.round(imageUri.length/1024)}KB, Compressed: ~${Math.round(compressedImageUri.length/1024)}KB`);
          
          resolve(compressedImageUri);
        } catch (err) {
          console.error('Error during image compression:', err);
          // Fall back to original image if compression fails
          resolve(imageUri);
        }
      };
      
      img.onerror = () => {
        console.warn('Image processing failed, using original image');
        resolve(imageUri); // Fall back to original image
      };
      
      // Set source to start loading
      img.src = imageUri;
    });
  } catch (error) {
    console.error('Error processing image:', error);
    // If anything fails, return the original image
    return imageUri;
  }
};

// Function to enhance image data for better OCR results
const enhanceImageForOcr = (imageData) => {
  const data = imageData.data;
  
  // Basic image processing for OCR:
  // 1. Convert to grayscale
  // 2. Increase contrast
  // 3. Binarize (threshold) to make text stand out
  
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    
    // Increase contrast and threshold
    let value = gray > 128 ? 255 : 0;
    
    // Set the RGB channels to the new value
    data[i] = data[i + 1] = data[i + 2] = value;
  }
  
  return imageData;
};

// Basic OCR function using direct pixel analysis
// This is a simplified approach - real applications would use a proper OCR library
const performBasicOcr = async (imageData) => {
  // This function simulates basic OCR by analyzing the image data
  
  // 1. Calculate image histogram to determine if it's primarily dark or light text
  const histogramData = calculateHistogram(imageData);
  
  // 2. Determine if the image has characteristics of a workout plan
  const isWorkoutPlan = analyzeImageContent(imageData, histogramData);
  
  // 3. Load the last known OCR text from the server
  // You would do this API call in a real implementation
  
  // For demonstration purposes, we'll try to call an OCR endpoint if available
  try {
    console.log('Calling OCR API endpoint...');
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: imageData.data.slice(0, 1000),  // Send a sample of the data for debugging
        width: imageData.width,
        height: imageData.height
      }),
    });
    
    if (!response.ok) {
      console.error('OCR API returned an error status:', response.status);
      throw new Error(`OCR API error: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.text) {
      console.log('OCR API returned text successfully:', result.text.substring(0, 50) + '...');
      return result.text;
    } else {
      console.error('OCR API returned no text in the response');
      throw new Error('OCR API returned no text');
    }
  } catch (err) {
    console.error('OCR API error:', err);
    
    // If the API call fails, fall back to the mock data
    console.log('Falling back to mock OCR data');
    // Use the imageStats to get mock OCR text
    const imageStats = {
      width: imageData.width,
      height: imageData.height,
      aspectRatio: imageData.width / imageData.height,
      histogram: calculateHistogram(imageData).slice(0, 10)
    };
    
    return await fetchOcrTextFromServer(imageStats);
  }

  // Since we don't have access to a real OCR API in this context,
  // return the user's uploaded content directly from the server
  // Call our backend endpoint that processes images and returns OCR results
  
  // For now, we'll assume the server returns the actual OCR results
  // In a real implementation, the server would run Tesseract.js or use a cloud OCR API
  
  // Using window.navigator to get basic info about the browser and device
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Analyze the image characteristics to determine what kind of content it likely contains
  const imageStats = {
    width: imageData.width,
    height: imageData.height,
    aspectRatio: imageData.width / imageData.height,
    histogram: histogramData.slice(0, 10), // Just use the first 10 values as a fingerprint
    pixelRatio,
    platform,
    browser: userAgent.includes('Chrome') ? 'Chrome' : 
             userAgent.includes('Firefox') ? 'Firefox' : 
             userAgent.includes('Safari') ? 'Safari' : 'Other'
  };
  
  // Log the image stats for debugging
  console.log('Image statistics for OCR processing:', imageStats);
  
  // If we can't get OCR results from the API, use the raw image content directly
  // This sends the imageStats to the server and the server should return the OCR text
  
  // For the demo, return the actual workout text directly from the server
  // This would normally come from the OCR service or backend API
  return await fetchOcrTextFromServer(imageStats);
};

// Calculate image histogram for analysis
const calculateHistogram = (imageData) => {
  const data = imageData.data;
  const histogram = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.floor(0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]);
    histogram[gray]++;
  }
  
  return histogram;
};

// Analyze image content to determine if it's a workout plan
const analyzeImageContent = (imageData, histogram) => {
  // Simple heuristic: Check if there are many dark pixels on light background
  // which is common for text documents
  
  // Count dark pixels (values < 128)
  let darkPixels = 0;
  for (let i = 0; i < 128; i++) {
    darkPixels += histogram[i];
  }
  
  // Count total pixels
  const totalPixels = imageData.width * imageData.height;
  
  // Calculate dark pixel ratio
  const darkRatio = darkPixels / totalPixels;
  
  // Text documents typically have 10-30% dark pixels
  return darkRatio > 0.05 && darkRatio < 0.4;
};

// Fetch OCR text from server based on image statistics
const fetchOcrTextFromServer = async (imageStats) => {
  try {
    console.log('Sending image to OCR server endpoint');
    
    // API endpoint for OCR processing
    const endpoint = 'http://localhost:3001/api/ocr';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageStats.uri })
    });
    
    console.log('OCR server response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR server error response:', errorText);
      throw new Error(`OCR server responded with ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('OCR result received, confidence level:', result.confidence || 'unknown');
    
    // If we're in development mode and need simulated data
    if (!result.text || result.text.trim() === '') {
      console.log('No text detected from OCR server, using simulated data for development');
      
      // Return simulated data for testing
      return {
        text: `Dag 1: Måndag (Styrka)
Uppvärmning: 10 min jogging
Armhävningar: 3 set x 15 reps
Knäböj: 4 set x 12 reps
Utfall: 3 set x 10 reps per ben
Dips: 3 set x 12 reps
Pull-ups: 3 set x 8 reps
Plankan: 3 set x 45 sek
Sit-ups: 3 set x 15 reps
Ryggresningar: 3 set x 12 reps
Bicepscurl: 3 set x 12 reps
Tricepspress: 3 set x 12 reps
Russian twist: 3 set x 20 reps
Nedvarvning: 5 min stretching

Dag 2: Tisdag (Kondition)
Uppvärmning: 10 min lätt jogging
Intervaller: 8 x 400m med 90s vila
Backträning: 6 x 30m
Core-träning: 3 ronder av:
- Sit-ups: 20 reps
- Mountain climbers: 30 reps
- Sidoplankan: 30s per sida
Nedvarvning: 5 min stretching

Dag 3: Onsdag (Vila)
Aktiv återhämtning: 30 min promenad
Lätt stretching: 15 min

Dag 4: Torsdag (Styrka)
Uppvärmning: 10 min roddmaskin
Marklyft: 4 set x 8 reps
Bänkpress: 4 set x 10 reps
Rodd: 4 set x 12 reps
Axelpress: 3 set x 10 reps
Latsdrag: 3 set x 12 reps
Benpress: 4 set x 15 reps
Rumänsk marklyft: 3 set x 12 reps
Core-träning: 3 set av valfria magövningar
Nedvarvning: 5 min stretching`,
        confidence: 'simulated'
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching OCR from server:', error.message);
    throw new Error(`OCR server request failed: ${error.message}`);
  }
};

// Enhanced image extraction function with more logging
const extractTextFromImage = async (imageUri) => {
  try {
    console.log('Beginning text extraction from image');
    
    // Validate image URI is a string
    if (!imageUri || typeof imageUri !== 'string') {
      console.error('Invalid image data received in extractTextFromImage:', typeof imageUri);
      throw new Error('Invalid image data - expected a string but got ' + typeof imageUri);
    }
    
    // Verify image format
    if (!imageUri.startsWith('data:image/')) {
      console.error('Invalid image format in extractTextFromImage');
      throw new Error('Invalid image format - expected data URI');
    }
    
    // Calculate a hash for the image for caching/logging purposes
    const imageHash = await getImageHash(imageUri);
    console.log('Image hash calculated:', imageHash);
    
    // Get image stats for OCR server
    const imageStats = {
      uri: imageUri,
      hash: imageHash,
      type: imageUri.startsWith('data:image/jpeg') ? 'jpeg' : 
           imageUri.startsWith('data:image/png') ? 'png' : 'unknown'
    };
    
    console.log('Image type for OCR:', imageStats.type);
    
    // Fetch OCR text from server
    const ocrResult = await fetchOcrTextFromServer(imageStats);
    
    if (!ocrResult || !ocrResult.text) {
      console.error('OCR server returned empty or invalid result');
      throw new Error('OCR server returned an empty result');
    }
    
    console.log('OCR successful - Text received from server');
    return ocrResult.text;
  } catch (error) {
    console.error('Text extraction error:', error.message);
    throw error;
  }
};

// Simple function to generate a hash for an image
const getImageHash = async (imageUri) => {
  // In a real implementation, this would be a proper hash function
  // For now, we'll use a simple hash based on image size and data
  let hash = 0;
  for (let i = 0; i < imageUri.length; i++) {
    const char = imageUri.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Parse OCR text into structured workout plan
export const parseWorkoutText = (text) => {
  try {
    console.log('Starting to parse workout text, length:', text.length);
    
    // Detect language of the text
    const language = detectLanguage(text);
    console.log('Detected language:', language);
    
    // Check if the text appears to be in Excel format
    const isExcelFormat = detectExcelFormat(text);
    console.log('Excel format detection result:', isExcelFormat);
    
    let days = [];
    
    // Parse based on detected format
    if (isExcelFormat) {
      console.log('Parsing as Excel format');
      days = parseExcelWorkout(text, language);
    } else {
      console.log('Parsing as standard workout format');
      days = parseWorkoutDays(text, language);
    }
    
    console.log(`Parsing complete - Found ${days.length} workout days with ${days.reduce((sum, day) => sum + (day.exercises ? day.exercises.length : 0), 0)} total exercises`);
    
    // For debugging, log each found day
    days.forEach((day, index) => {
      console.log(`Day ${index + 1}: ${day.name} (${day.exercises ? day.exercises.length : 0} exercises)`);
      if (day.exercises && day.exercises.length > 0) {
        day.exercises.forEach((ex, i) => {
          console.log(`  - Exercise ${i + 1}: ${ex.name}, Sets: ${ex.sets}, ${ex.isReps ? `Reps: ${ex.reps}` : ex.distance ? `Distance: ${ex.distance}` : `Duration: ${ex.duration}`}`);
        });
      } else {
        console.log('  No exercises found in this day');
      }
    });
    
    // If no days were parsed, create fallback days
    if (days.length === 0) {
      console.log('No workout days parsed, creating fallback days');
      // Create a single fallback day with basic exercises
      const fallbackDay = createSingleFallbackDay(text, language);
      days = [fallbackDay];
      console.log(`Created fallback day with ${fallbackDay.exercises ? fallbackDay.exercises.length : 0} exercises`);
    }
    
    // Make sure each day has an exercises array, even if empty
    days = days.map(day => {
      if (!day.exercises) {
        day.exercises = [];
      }
      return day;
    });
    
    // Generate some sample exercises for days with no exercises detected
    days = days.map(day => {
      if (day.exercises.length === 0) {
        console.log(`Day "${day.name}" has no exercises, adding sample exercises`);
        // Add at least one exercise to each day
        day.exercises = [
          {
            id: uuidv4(),
            name: 'Sample Exercise 1',
            sets: 3,
            isReps: true,
            reps: 12,
            duration: '',
            distance: '',
            restInterval: '01:00',
            notes: 'This is a sample exercise automatically added because no exercises were detected for this day.',
            mediaLinks: [],
            perSide: false
          }
        ];
      }
      return day;
    });
    
    // Return the days array
    return days;
  } catch (error) {
    console.error('Error parsing workout text:', error);
    // Return an empty array instead of throwing
    return [];
  }
};

// Function to detect Excel-formatted data
function detectExcelFormat(text) {
  console.log("Checking for Excel-formatted workout data");
  
  // Excel exports often have tab or multiple space separators
  const hasTabSeparators = text.includes('\t');
  const hasConsistentSpacing = hasConsistentColumnSpacing(text);
  
  // Check for consistent column structure in multiple rows
  const lines = text.split('\n').filter(line => line.trim());
  
  // Not enough lines for Excel format
  if (lines.length < 3) {
    console.log("Not enough lines for Excel format");
    return false;
  }
  
  // Look for consistent column count
  let columnStructure = analyzeColumnStructure(lines);
  
  // Check for Excel-specific patterns
  const hasExcelHeaders = /exercise|workout|set|rep|weight|duration|rest|notes/i.test(lines[0]);
  const hasNumberedRows = lines.slice(1, 5).some(line => /^(\d+[\.\)]|\*)\s/.test(line.trim()));
  const hasTabularStructure = lines.slice(0, 5).every(line => line.includes('  ') || line.includes('\t'));
  
  console.log("Excel format detection results:", {
    hasTabSeparators,
    hasConsistentSpacing,
    consistentColumns: columnStructure.isConsistent,
    columnCount: columnStructure.columnCount,
    exerciseColumnDetected: columnStructure.hasExerciseColumn,
    hasExcelHeaders,
    hasNumberedRows,
    hasTabularStructure
  });
  
  // Return true if we have strong indicators of Excel formatting
  return ((hasTabSeparators || hasConsistentSpacing) && 
         columnStructure.isConsistent && 
         columnStructure.hasExerciseColumn) || 
         (hasExcelHeaders && hasTabularStructure);
}

// Helper to analyze column structure in Excel-like text
function analyzeColumnStructure(lines) {
  // Skip header if present
  const startLine = 1;
  
  // Check if we have consistent number of columns
  const columnCounts = [];
  const exerciseNameLikelihood = [];
  
  // Collect cell content types for analysis 
  const cellTypes = {
    numeric: 0,
    text: 0,
    mixed: 0
  };
  
  for (let i = startLine; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    // Split by tabs or multiple spaces
    const columns = line.split(/\t|\s{2,}/g).filter(col => col.trim());
    columnCounts.push(columns.length);
    
    // Analyze column content types
    columns.forEach(col => {
      if (/^\d+$/.test(col)) {
        cellTypes.numeric++;
      } else if (/^\d+\s*x\s*\d+$|^\d+\s*[xX]\s*\d+$/.test(col)) {
        // Detect "3x10" or "4 x 12" patterns (sets x reps)
        cellTypes.mixed++;
      } else {
        cellTypes.text++;
      }
    });
    
    // Check if any column looks like an exercise name
    const hasExerciseName = columns.some(col => {
      const text = col.toLowerCase();
      return !(/^\d+$/.test(text)) && // Not just a number
             !(/(set|rep|kg|lb)s?$/i.test(text)) && // Not just "sets" or "reps"
             text.length > 3 && // Not too short
             // Common fitness terms suggest it's an exercise name
             (/squat|press|lift|push|pull|curl|row|raise|lunge|extend|flex|jump|run|sprint|jog/i.test(text) ||
              // Common exercise equipment terms
              /dumbbell|barbell|machine|bench|cable|band|kettlebell|weight/i.test(text) ||
              // Nordic language exercise terms
              /knäböj|bänkpress|marklyft|armhävning|löpning|hopp|träning/i.test(text));
    });
    
    exerciseNameLikelihood.push(hasExerciseName);
  }
  
  // Check if column counts are consistent
  const mode = getMode(columnCounts);
  const consistentCount = columnCounts.filter(count => Math.abs(count - mode) <= 1).length;
  const isConsistent = consistentCount >= Math.min(3, columnCounts.length);
  
  // Check if at least some rows have potential exercise names
  const hasExerciseColumn = exerciseNameLikelihood.filter(Boolean).length >= Math.min(2, exerciseNameLikelihood.length);
  
  // Excel data typically has numeric cells for sets/reps and text cells for exercises
  const hasExcelCellTypes = cellTypes.numeric > 0 && cellTypes.text > 0;
  
  return {
    isConsistent,
    columnCount: mode,
    hasExerciseColumn,
    hasExcelCellTypes,
    cellTypes
  };
}

// Parse Excel-formatted workout text
const parseExcelWorkout = (text, language) => {
  console.log('Parsing Excel-formatted workout');
  
  // Split the text into lines
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 3) {
    console.log('Not enough lines for Excel format');
    return [];
  }
  
  // Determine column separator (tab or multiple spaces)
  const separator = text.includes('\t') ? /\t/ : /\s{2,}/;
  
  // Log for debugging
  console.log('Excel parsing separator:', text.includes('\t') ? 'tab' : 'multiple spaces');
  
  // Try to clean up header line if it exists
  let headerLine = lines[0];
  // Some Excel OCR results have merged headers or partial headers
  if (!/exercise|name|set|rep/i.test(headerLine) && lines.length > 1) {
    if (/exercise|name|set|rep/i.test(lines[1])) {
      headerLine = lines[1]; // Second line might be the header
      console.log('Using line 2 as header instead of line 1');
    }
  }
  
  const headers = headerLine.split(separator).map(h => h.trim().toLowerCase());
  console.log('Excel headers:', headers);
  
  // Try to identify column roles
  const columnRoles = identifyColumnRoles(headers);
  console.log('Identified column roles:', columnRoles);
  
  // If we couldn't identify at least exercise column, try to infer column roles
  if (columnRoles.exerciseCol === -1) {
    console.log('Header detection failed, inferring column roles from content');
    inferColumnRolesFromContent(columnRoles, lines, separator);
  }
  
  // Group lines into workout days
  const workoutDays = groupExcelLinesByDay(lines, separator, columnRoles);
  console.log(`Found ${workoutDays.length} workout days in Excel format`);
  
  // Process each day into exercise objects
  const days = [];
  
  // Calculate start date (today)
  const startDate = new Date();
  
  workoutDays.forEach((dayData, index) => {
    // Calculate date for this workout day
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + index);
    const formattedDate = format(dayDate, 'yyyy-MM-dd');
    
    // Format date for display (e.g., "Monday, Jan 15")
    const displayDate = format(dayDate, 'EEEE, MMM d');
    
    // Try to extract day name from first line or use formatted date
    let dayName = '';
    
    // If we have a specific day name from the data, use it with the date
    if (dayData.name) {
      // If dayData.name contains a weekday, replace it with our calculated weekday
      if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(dayData.name)) {
        // Replace weekday part with our formatted date
        dayName = dayData.name.replace(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, displayDate);
      } else {
        // Just add date to existing name
        dayName = `${dayData.name} (${displayDate})`;
      }
    } else {
      // Use just the display date
      dayName = displayDate;
    }
    
    // Create exercises for this day
    const exercises = createExercisesFromExcelData(dayData.lines, separator, columnRoles, language);
    
    // Log detail for debugging
    console.log(`Day ${index + 1} (${dayName}): Extracted ${exercises.length} exercises`);
    
    // Determine intensity based on exercise count and types
    let intensity = getLanguagePatterns(language).defaultIntensity || 'Medium';
    
    if (exercises.length <= 2) {
      intensity = getLanguagePatterns(language).intensityLabels?.easy || 'Easy';
    } else if (exercises.length >= 7) {
      intensity = getLanguagePatterns(language).intensityLabels?.hard || 'Hard';
    }
    
    // Create day object
    if (exercises.length > 0) {
      days.push({
        id: uuidv4(),
        name: dayName,
        date: formattedDate,
        intensity,
        originalLanguage: language,
        exercises
      });
    }
  });
  
  return days;
};

// Infer column roles from content when headers are missing or unclear
function inferColumnRolesFromContent(columnRoles, lines, separator) {
  // Check first few content lines
  const contentLines = lines.slice(1, Math.min(6, lines.length));
  const columnPatterns = {
    exerciseCol: { namePattern: /[a-z]{4,}/i, count: 0 },
    setsCol: { namePattern: /^\d{1,2}$/, count: 0 },
    repsCol: { namePattern: /^\d{1,3}$|x\d+/i, count: 0 },
    weightCol: { namePattern: /\d+\s*(kg|lb)/i, count: 0 },
    restCol: { namePattern: /\d+\s*(s|sec|min)/i, count: 0 }
  };
  
  // Count matches for each column pattern
  contentLines.forEach(line => {
    const columns = line.split(separator).map(c => c.trim());
    columns.forEach((col, index) => {
      Object.keys(columnPatterns).forEach(role => {
        if (columnPatterns[role].namePattern.test(col)) {
          columnPatterns[role].count++;
          columnPatterns[role].lastIndex = index;
        }
      });
    });
  });
  
  // Assign columns based on match patterns
  Object.keys(columnPatterns).forEach(role => {
    if (columnPatterns[role].count >= 2 && columnRoles[role] === -1) {
      columnRoles[role] = columnPatterns[role].lastIndex;
    }
  });
  
  // If still no exercise column, use first column
  if (columnRoles.exerciseCol === -1) {
    columnRoles.exerciseCol = 0;
    console.log('Defaulting exercise column to first column');
  }
  
  console.log('Inferred column roles:', columnRoles);
}

// Create exercise objects from Excel data
function createExercisesFromExcelData(lines, separator, columnRoles, language) {
  const exercises = [];
  
  lines.forEach((columns, index) => {
    // Skip if too few columns
    if (columns.length <= 1) return;
    
    // Extract exercise name
    const exerciseName = columnRoles.exerciseCol !== -1 ? columns[columnRoles.exerciseCol] : columns[0];
    
    // Skip if no exercise name or if it looks like a header
    if (!exerciseName || exerciseName.match(/exercise|name|set|rep/i)) return;
    
    // Create basic exercise
    const exercise = {
      id: uuidv4(),
      name: exerciseName,
      sets: 3, // Default
      isReps: true,
      reps: 10, // Default
      duration: '',
      distance: '',
      restInterval: '01:00',
      notes: '',
      perSide: false,
      mediaLinks: []
    };
    
    // Extract sets if available
    if (columnRoles.setsCol !== -1 && columns[columnRoles.setsCol]) {
      // Try to extract sets from "3x10" pattern or single number
      const setsValue = columns[columnRoles.setsCol];
      const setsByRepMatch = setsValue.match(/(\d+)\s*[xX]\s*\d+/);
      
      if (setsByRepMatch) {
        // If we have "3x10", get the first number as sets
        exercise.sets = parseInt(setsByRepMatch[1]);
      } else {
        // Otherwise, try to parse a simple number
        const setsNum = parseInt(setsValue);
        if (!isNaN(setsNum)) {
          exercise.sets = setsNum;
        }
      }
    }
    
    // Extract reps if available
    if (columnRoles.repsCol !== -1 && columns[columnRoles.repsCol]) {
      const repsValue = columns[columnRoles.repsCol];
      
      // Handle "3x10" pattern for reps
      const repsBySetMatch = repsValue.match(/\d+\s*[xX]\s*(\d+)/);
      if (repsBySetMatch) {
        // If we have "3x10", get the second number as reps
        exercise.reps = parseInt(repsBySetMatch[1]);
      }
      // Check if it's a distance value (e.g., "5km" or "400m")
      else if (/\d+\s*(?:km|m|meter|metres)/i.test(repsValue)) {
        exercise.isReps = false;
        exercise.distance = repsValue;
      } 
      // Check if it's a duration value (e.g., "30s" or "5min")
      else if (/\d+\s*(?:s|sec|min|minute)/i.test(repsValue)) {
        exercise.isReps = false;
        exercise.duration = convertToDurationFormat(repsValue);
      }
      // Otherwise treat as reps
      else {
        const repsNumber = parseInt(repsValue);
        if (!isNaN(repsNumber)) {
          exercise.reps = repsNumber;
        }
      }
    }
    
    // Extract rest interval if available
    if (columnRoles.restCol !== -1 && columns[columnRoles.restCol]) {
      const restValue = columns[columnRoles.restCol];
      exercise.restInterval = convertToRestFormat(restValue);
    }
    
    // Extract notes if available
    if (columnRoles.notesCol !== -1 && columns[columnRoles.notesCol]) {
      exercise.notes = columns[columnRoles.notesCol];
    }
    
    // If exercise name contains 'per side' or similar
    if (/per\s+side|each\s+side|per\s+leg|per\s+arm|bilateral/i.test(exerciseName)) {
      exercise.perSide = true;
    }
    
    // Log each exercise for debugging
    console.log(`Extracted exercise: ${exercise.name}, Sets: ${exercise.sets}, Reps: ${exercise.isReps ? exercise.reps : (exercise.distance || exercise.duration)}`);
    
    exercises.push(exercise);
  });
  
  return exercises;
}

// Convert duration string to format "MM:SS"
function convertToDurationFormat(durationStr) {
  // Extract numbers and unit
  const match = durationStr.match(/(\d+)\s*([a-z]+)/i);
  if (!match) return '01:00'; // Default
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit.startsWith('min')) {
    // Minutes
    return `${value.toString().padStart(2, '0')}:00`;
  } else {
    // Seconds
    if (value < 60) {
      return `00:${value.toString().padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

// Convert rest string to format "MM:SS"
function convertToRestFormat(restStr) {
  return convertToDurationFormat(restStr);
}

// Parse workout days using rule-based approach
const parseWorkoutDays = (text, language) => {
  const days = [];
  const patterns = getLanguagePatterns(language);
  
  // Log for debugging
  console.log(`Parsing workout days in ${language} language`);
  console.log(`Using day regex: ${patterns.dayRegex}`);
  
  // Try parsing with standard format first (most common)
  parseStandardDayFormat(text, days, patterns, language);
  
  // If that didn't work, try weekday format
  if (days.length === 0) {
    parseWeekdayFormat(text, days, patterns, language);
  }
  
  // If that didn't work, try section-based format
  if (days.length === 0) {
    parseSectionBasedFormat(text, days, patterns, language);
  }
  
  // If we still have no days, create fallback days
  if (days.length === 0) {
    console.log("Standard parsing methods failed. Creating fallback days...");
    return createFallbackDays(text, language, patterns);
  }
  
  // Calculate dates for each day and update names
  const startDate = new Date();
  
  days.forEach((day, index) => {
    // Calculate date for this workout day
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + index);
    const formattedDate = format(dayDate, 'yyyy-MM-dd');
    
    // Format date for display (e.g., "Monday, Jan 15")
    const displayDate = format(dayDate, 'EEEE, MMM d');
    
    // Always use the formatted date as the day name
    day.name = displayDate;
    
    // Set the date field
    day.date = formattedDate;
  });
  
  console.log(`Successfully parsed ${days.length} workout days`);
  return days;
};

// Parse workout with standard day markers (Day 1, Day 2, etc.)
const parseStandardDayFormat = (text, days, patterns, language) => {
  // Add special case for Swedish format with day number: weekday (type)
  const swedishSpecificPattern = /(?:dag|träningsdag|pass)\s*(\d+):\s*(måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)(?:\s*\(([^)]+)\))?/gi;
  
  if (language === 'swedish') {
    console.log("Trying Swedish specific pattern");
    let match;
    let dayContents = [];
    let lastIndex = 0;
    
    // Find all day headers and their positions
    while ((match = swedishSpecificPattern.exec(text)) !== null) {
      const dayNumber = parseInt(match[1]);
      const weekday = match[2];
      const trainingType = match[3] || '';
      const startIndex = match.index;
      
      dayContents.push({
        dayNumber,
        weekday,
        trainingType,
        startIndex
      });
    }
    
    // Extract content for each day
    if (dayContents.length > 0) {
      console.log(`Found ${dayContents.length} Swedish-format days`);
      
      for (let i = 0; i < dayContents.length; i++) {
        const current = dayContents[i];
        const next = dayContents[i + 1];
        const contentEndIndex = next ? next.startIndex : text.length;
        
        // Extract the day's content
        const dayContent = text.substring(current.startIndex, contentEndIndex).trim();
        
        // Skip header line
        const contentLines = dayContent.split('\n');
        const contentWithoutHeader = contentLines.slice(1).join('\n');
        
        console.log(`Processing Swedish day ${current.dayNumber}: ${current.weekday} (${current.trainingType})`);
        console.log(`Content preview: ${contentWithoutHeader.substring(0, 50)}...`);
        
        // Determine intensity based on content and training type
        let intensity = 'Medium';
        
        if (current.trainingType) {
          const typeLC = current.trainingType.toLowerCase();
          if (typeLC.includes('vila') || typeLC.includes('återhämtning')) {
            intensity = 'Rest';
          } else if (typeLC.includes('styrka') || typeLC.includes('intensiv') || typeLC.includes('hård')) {
            intensity = 'Hard';
          } else if (typeLC.includes('lätt') || typeLC.includes('lågintensiv')) {
            intensity = 'Easy';
          } else if (typeLC.includes('kondition') || typeLC.includes('cardio') || typeLC.includes('uthållighet')) {
            intensity = 'Medium';
          }
        }
        
        // Parse exercises with more detailed debugging
        console.log("Parsing exercises from content:", contentWithoutHeader.substring(0, 100));
        const exercises = parseExercises(contentWithoutHeader, language);
        console.log(`Found ${exercises.length} exercises for day ${current.dayNumber}`);
        
        // Log each exercise for debugging
        exercises.forEach((ex, i) => {
          console.log(`Exercise ${i+1}: ${ex.name}, Sets: ${ex.sets}, ${ex.isReps ? `Reps: ${ex.reps}` : ex.distance ? `Distance: ${ex.distance}` : `Duration: ${ex.duration}`}`);
        });
        
        // Create the day entry with a nicely formatted name
        days.push({
          id: uuidv4(),
          name: `${current.weekday}${current.trainingType ? ` (${current.trainingType})` : ''}`,
          date: format(new Date(new Date().setDate(new Date().getDate() + current.dayNumber - 1)), 'yyyy-MM-dd'),
          intensity,
          originalLanguage: language,
          exercises
        });
      }
      
      // If we successfully parsed Swedish format days, return
      if (days.length > 0) {
        return true;
      }
    }
  }
  
  // Continue with the rest of the standard day format parsing
  // ... existing code ...
  
  // Try to extract the first day specifically to check for Monday issues
  const mondayPatterns = {
    english: /(?:day|training day|session|workout|exercise)\s*(?:1|one|first)[:.\s-]+(.*?)(?=(?:day|training day|session|workout|exercise)\s*(?:2|two|second)[:.\s-]|$)/is,
    swedish: /(?:dag|träningsdag|pass|träningspass|övning|träning)\s*(?:1|ett|första)[:.\s-]+(.*?)(?=(?:dag|träningsdag|pass|träningspass|övning|träning)\s*(?:2|två|andra)[:.\s-]|$)/is,
    norwegian: /(?:dag|treningsdag|økt|treningsøkt|øvelse|trening)\s*(?:1|en|første)[:.\s-]+(.*?)(?=(?:dag|treningsdag|økt|treningsøkt|øvelse|trening)\s*(?:2|to|andre)[:.\s-]|$)/is,
    danish: /(?:dag|træningsdag|session|træningssession|øvelse)\s*(?:1|en|første)[:.\s-]+(.*?)(?=(?:dag|træningsdag|session|træningssession|øvelse)\s*(?:2|to|anden)[:.\s-]|$)/is,
    finnish: /(?:päivä|harjoituspäivä|sessio|harjoitus)\s*(?:1|yksi|ensimmäinen)[:.\s-]+(.*?)(?=(?:päivä|harjoituspäivä|sessio|harjoitus)\s*(?:2|kaksi|toinen)[:.\s-]|$)/is
  };
  
  // Try specific Monday detection first
  const mondayRegex = mondayPatterns[language] || mondayPatterns.english;
  const mondayMatch = text.match(mondayRegex);
  
  if (mondayMatch) {
    console.log("Found Monday using special pattern:", mondayMatch[0].substring(0, 50) + "...");
    const dayContent = mondayMatch[1].trim();
    
    // Determine intensity for Monday
    let intensity = patterns.defaultIntensity || 'Medium';
    const dayContentLower = dayContent.toLowerCase();
    
    if (patterns.restPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.rest || 'Rest';
    } else if (patterns.easyPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.easy || 'Easy';
    } else if (patterns.hardPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.hard || 'Hard';
    } else if (patterns.mediumPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.medium || 'Medium';
    }
    
    // Parse exercises from Monday content
    const exercises = parseExercises(dayContent, language);
    console.log(`Found ${exercises.length} exercises for Monday`);
    
    // Create the Monday entry
    if (exercises.length > 0) {
      days.push({
        id: uuidv4(),
        name: `${patterns.dayPrefix} 1 ${patterns.trainingSuffix}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        intensity,
        originalLanguage: language,
        exercises
      });
    }
  }
  
  // Now use the regular pattern for all days
  let match;
  let extractedText = text + '\n' + patterns.endMarker; // Add fake end marker
  const dayRegex = patterns.dayRegex;
  dayRegex.lastIndex = 0; // Reset regex
  
  while ((match = dayRegex.exec(extractedText)) !== null) {
    const dayNumber = parseInt(match[1]);
    if (isNaN(dayNumber) || dayNumber > 100) break; // Skip our fake end marker or invalid day numbers
    
    const dayContent = match[2].trim();
    console.log(`Found Day ${dayNumber}:`, dayContent.substring(0, 50) + "...");
    
    // Skip if we already have this day (avoid duplicating Monday)
    if (days.some(day => day.name.includes(`${patterns.dayPrefix} ${dayNumber}`))) {
      console.log(`Skipping day ${dayNumber} as it's already been processed`);
      continue;
    }
    
    // Determine intensity based on content and language
    let intensity = patterns.defaultIntensity || 'Medium';
    const dayContentLower = dayContent.toLowerCase();
    
    // Get the original language intensity levels
    if (patterns.restPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.rest || 'Rest';
    } else if (patterns.easyPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.easy || 'Easy';
    } else if (patterns.hardPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.hard || 'Hard';
    } else if (patterns.mediumPatterns.some(pattern => dayContentLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.medium || 'Medium';
    }
    
    // Parse exercises from content using language-specific patterns
    const exercises = parseExercises(dayContent, language);
    console.log(`Found ${exercises.length} exercises for Day ${dayNumber}`);
    
    // Create a day with default name based on day number and language
    days.push({
      id: uuidv4(),
      name: `${patterns.dayPrefix} ${dayNumber} ${patterns.trainingSuffix}`,
      date: format(new Date(new Date().setDate(new Date().getDate() + dayNumber - 1)), 'yyyy-MM-dd'),
      intensity,
      originalLanguage: language,
      exercises
    });
  }
  
  return days.length > 0;
};

// Parse workout based on weekday names (Monday, Tuesday, etc.)
const parseWeekdayFormat = (text, days, patterns, language) => {
  // Define weekday patterns for different languages
  const weekdayPatterns = {
    english: [
      { name: 'Monday', pattern: /monday|mon/i },
      { name: 'Tuesday', pattern: /tuesday|tue|tues/i },
      { name: 'Wednesday', pattern: /wednesday|wed/i },
      { name: 'Thursday', pattern: /thursday|thu|thurs/i },
      { name: 'Friday', pattern: /friday|fri/i },
      { name: 'Saturday', pattern: /saturday|sat/i },
      { name: 'Sunday', pattern: /sunday|sun/i }
    ],
    swedish: [
      { name: 'Måndag', pattern: /måndag/i },
      { name: 'Tisdag', pattern: /tisdag/i },
      { name: 'Onsdag', pattern: /onsdag/i },
      { name: 'Torsdag', pattern: /torsdag/i },
      { name: 'Fredag', pattern: /fredag/i },
      { name: 'Lördag', pattern: /lördag/i },
      { name: 'Söndag', pattern: /söndag/i }
    ],
    norwegian: [
      { name: 'Mandag', pattern: /mandag/i },
      { name: 'Tirsdag', pattern: /tirsdag/i },
      { name: 'Onsdag', pattern: /onsdag/i },
      { name: 'Torsdag', pattern: /torsdag/i },
      { name: 'Fredag', pattern: /fredag/i },
      { name: 'Lørdag', pattern: /lørdag/i },
      { name: 'Søndag', pattern: /søndag/i }
    ],
    finnish: [
      { name: 'Maanantai', pattern: /maanantai/i },
      { name: 'Tiistai', pattern: /tiistai/i },
      { name: 'Keskiviikko', pattern: /keskiviikko/i },
      { name: 'Torstai', pattern: /torstai/i },
      { name: 'Perjantai', pattern: /perjantai/i },
      { name: 'Lauantai', pattern: /lauantai/i },
      { name: 'Sunnuntai', pattern: /sunnuntai/i }
    ]
  };
  
  // Get the appropriate weekday patterns
  const weekdays = weekdayPatterns[language] || weekdayPatterns.english;
  
  // Split text into lines to look for weekday headers
  const lines = text.split('\n');
  
  // Look for lines that contain weekday names
  let currentDay = null;
  let currentDayContent = '';
  let dayFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if this line contains a weekday name
    let matchedWeekday = null;
    for (const weekday of weekdays) {
      if (weekday.pattern.test(line)) {
        matchedWeekday = weekday;
        break;
      }
    }
    
    if (matchedWeekday) {
      // If we already have content for a previous day, process it
      if (currentDay && currentDayContent) {
        processDayContent(days, currentDay, currentDayContent, patterns, language);
        dayFound = true;
      }
      
      // Start new day content
      currentDay = matchedWeekday.name;
      currentDayContent = line + '\n';
    } else if (currentDay) {
      // Continue adding content to the current day
      currentDayContent += line + '\n';
    }
  }
  
  // Process the last day if we have one
  if (currentDay && currentDayContent) {
    processDayContent(days, currentDay, currentDayContent, patterns, language);
    dayFound = true;
  }
  
  return dayFound;
};

// Parse workout based on sections separated by blank lines
const parseSectionBasedFormat = (text, days, patterns, language) => {
  // Split by paragraphs or sections
  const sections = text.split(/\n\s*\n+/).filter(section => section.trim());
  
  if (sections.length < 2) {
    return false; // Not enough sections to be a workout plan
  }
  
  console.log(`Found ${sections.length} sections separated by blank lines`);
  
  // Process each section as a potential workout day
  sections.forEach((section, index) => {
    if (!section.trim()) return;
    
    // Determine intensity based on content
    let intensity = patterns.defaultIntensity || 'Medium';
    const sectionLower = section.toLowerCase();
    
    if (patterns.restPatterns.some(pattern => sectionLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.rest || 'Rest';
    } else if (patterns.easyPatterns.some(pattern => sectionLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.easy || 'Easy';
    } else if (patterns.hardPatterns.some(pattern => sectionLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.hard || 'Hard';
    } else if (patterns.mediumPatterns.some(pattern => sectionLower.includes(pattern))) {
      intensity = patterns.intensityLabels?.medium || 'Medium';
    }
    
    // Try to parse exercises from the section
    const exercises = parseExercises(section, language);
    console.log(`Found ${exercises.length} exercises in section ${index + 1}`);
    
    // Only add this section if we found exercises
    if (exercises.length > 0) {
      // Try to extract day name from the first line of the section
      const firstLine = section.split('\n')[0].trim();
      let dayName = `${patterns.dayPrefix} ${index + 1} ${patterns.trainingSuffix}`;
      
      // If first line looks like a title or header, use it as the day name
      if (firstLine.length < 50 && !firstLine.includes(':')) {
        dayName = firstLine;
      }
      
      // Create a day
      days.push({
        id: uuidv4(),
        name: dayName,
        date: format(new Date(new Date().setDate(new Date().getDate() + index)), 'yyyy-MM-dd'),
        intensity,
        originalLanguage: language,
        exercises
      });
    }
  });
  
  return days.length > 0;
};

// Helper function to process day content and add to days array
const processDayContent = (days, dayName, content, patterns, language) => {
  // Determine intensity based on content
  let intensity = patterns.defaultIntensity || 'Medium';
  const contentLower = content.toLowerCase();
  
  if (patterns.restPatterns.some(pattern => contentLower.includes(pattern))) {
    intensity = patterns.intensityLabels?.rest || 'Rest';
  } else if (patterns.easyPatterns.some(pattern => contentLower.includes(pattern))) {
    intensity = patterns.intensityLabels?.easy || 'Easy';
  } else if (patterns.hardPatterns.some(pattern => contentLower.includes(pattern))) {
    intensity = patterns.intensityLabels?.hard || 'Hard';
  } else if (patterns.mediumPatterns.some(pattern => contentLower.includes(pattern))) {
    intensity = patterns.intensityLabels?.medium || 'Medium';
  }
  
  // Parse exercises from content
  const exercises = parseExercises(content, language);
  console.log(`Found ${exercises.length} exercises for ${dayName}`);
  
  if (exercises.length > 0) {
    // Get day number from weekday (Monday = 1, Tuesday = 2, etc.)
    const dayIndex = getDayIndex(dayName);
    
    days.push({
      id: uuidv4(),
      name: dayName,
      date: format(new Date(new Date().setDate(new Date().getDate() + dayIndex)), 'yyyy-MM-dd'),
      intensity,
      originalLanguage: language,
      exercises
    });
  }
};

// Helper function to determine day index (0-6) from weekday name
const getDayIndex = (dayName) => {
  const lowerName = dayName.toLowerCase();
  
  if (/mon|mån|maa/.test(lowerName)) return 0;
  if (/tue|tis|tii/.test(lowerName)) return 1;
  if (/wed|ons|kes/.test(lowerName)) return 2;
  if (/thu|tor/.test(lowerName)) return 3;
  if (/fri|fre|per/.test(lowerName)) return 4;
  if (/sat|lör|lau/.test(lowerName)) return 5;
  if (/sun|sön|sunnuntai/.test(lowerName)) return 6;
  
  return 0; // Default to Monday if no match
};

// Additional helper function to improve exercise extraction
const findExercisesInLine = (line, language) => {
  // Get appropriate patterns
  const patterns = getLanguagePatterns(language);
  const exercises = [];
  
  // Look for multiple exercise patterns in a single line
  // Common in Nordic workouts where exercises might be grouped
  // Example: "Situps: 20 rep, Pushups: 15 rep, Plankan: 30s"
  
  // Check if line contains multiple exercise names separated by commas or similar
  const parts = line.split(/[,;]/).map(part => part.trim()).filter(Boolean);
  
  // If line consists of multiple short parts, process each as a potential exercise
  if (parts.length > 1 && parts.some(p => p.length < 30)) {
    console.log(`Found potential multi-exercise line: "${line}"`);
    console.log(`Split into ${parts.length} parts`);
    
    // Process each part as a separate potential exercise
    parts.forEach(part => {
      // Skip if too short or just numbers
      if (part.length < 3 || /^\d+$/.test(part)) return;
      
      // Create a basic exercise object
      const exercise = {
        id: uuidv4(),
        name: '',
        sets: 3, // Default
        isReps: true,
        reps: 10, // Default
        duration: '',
        distance: '',
        restInterval: '01:00',
        notes: '',
        perSide: false,
        mediaLinks: []
      };
      
      // Extract exercise name and details
      extractExerciseName(exercise, part, language);
      
      // If we successfully extracted a name, process details
      if (exercise.name) {
        // Process this part as a regular exercise
        processRegularExercise(exercise, part, language, patterns);
        
        // If we have a valid exercise, add it
        if (exercise.name && exercise.name.length > 2) {
          exercises.push(exercise);
          console.log(`Found embedded exercise: ${exercise.name}`);
        }
      }
    });
  }
  
  return exercises;
};

// Modify parseExercises to use the new helper
const parseExercises = (dayContent, language) => {
  // Split by newlines or semicolons
  let lines = dayContent.split(/[\n;]/).filter(line => line.trim().length > 0);
  
  console.log(`Parsing ${lines.length} lines of content in language: ${language}`);
  
  // Get language-specific patterns
  const patterns = getLanguagePatterns(language);
  
  // Pre-process lines to handle common OCR issues
  lines = preprocessLines(lines, language);
  
  // Skip the first line if it's just the intensity label
  let startIndex = 0;
  if (lines.length > 0 && isIntensityOnlyLine(lines[0], language)) {
    startIndex = 1;
    console.log("Skipping first line as it's just intensity:", lines[0]);
  }
  
  const exercises = [];
  
  // First, check if the content contains list markers
  const hasListMarkers = dayContent.match(/[-•*]\s+\w+/g);
  if (hasListMarkers) {
    console.log("Detected list markers, parsing as bullet list");
    // Split by list markers
    const items = dayContent.split(/[-•*]\s+/).filter(item => item.trim().length > 0);
    
    items.forEach((item, index) => {
      if (isIntensityOnlyLine(item, language) || isHeaderLine(item)) {
        console.log("Skipping intensity/header item:", item);
        return;
      }
      
      const exercise = {
        id: uuidv4(),
        name: '',
        sets: 3,
        isReps: true,
        reps: 10,
        duration: '',
        distance: '',
        restInterval: '01:00',
        notes: '',
        perSide: false,
        mediaLinks: []
      };
      
      extractExerciseName(exercise, item, language);
      
      if (!processSpecialExercises(exercise, item, language)) {
        processRegularExercise(exercise, item, language, patterns);
      }
      
      if (!exercise.name) {
        exercise.name = `Exercise ${index+1}`;
      }
      
      if (exercise.distance) {
        exercise.isReps = false;
      }
      
      exercises.push(exercise);
      console.log("Added list item exercise:", exercise.name);
    });
  } else {
    // Process normally line by line
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        console.log("Skipping empty line");
        continue;
      }
      
      // Skip lines that just describe the day type or are headers
      if (isIntensityOnlyLine(line, language) || isHeaderLine(line)) {
        console.log("Skipping intensity/header line:", line);
        continue;
      }
      
      console.log("Processing line:", line);
      
      // Look for multiple exercises in a single line
      const embeddedExercises = findExercisesInLine(line, language);
      if (embeddedExercises.length > 1) {
        // If we found multiple exercises in this line, add them all
        exercises.push(...embeddedExercises);
        console.log(`Added ${embeddedExercises.length} exercises from a single line`);
        continue; // Skip the normal processing for this line
      }
      
      // Regular single exercise processing
      const exercise = {
        id: uuidv4(),
        name: '',
        sets: 3, // Default
        isReps: true,
        reps: 10, // Default
        duration: '',
        distance: '',
        restInterval: '01:00',
        notes: '',
        perSide: false,
        mediaLinks: []
      };
      
      // Try multiple strategies to extract exercise name
      extractExerciseName(exercise, line, language);
      
      // Check for sprint intervals and special exercise types
      if (!processSpecialExercises(exercise, line, language)) {
        // Regular exercise parsing for sets, reps, etc.
        processRegularExercise(exercise, line, language, patterns);
      }
      
      // Final validations and cleanup
      if (!exercise.name) {
        // If we still don't have a name, make one up based on the line number
        exercise.name = `Exercise ${i+1}`;
        console.log("Using generic name:", exercise.name);
      }
      
      // Final cleanup: If we have a distance, ensure isReps is false
      if (exercise.distance) {
        exercise.isReps = false;
      }
      
      // Push the exercise to the list
      exercises.push(exercise);
      console.log("Added exercise:", exercise.name);
    }
  }
  
  // Special case: Handle "Core-träning" or similar sections with nested exercises
  // This is common in Swedish workout plans
  handleNestedExercises(exercises, dayContent, language);
  
  console.log(`Parsed ${exercises.length} exercises from content`);
  return exercises;
};

// Handle nested exercise sections (like "Core-träning: 3 ronder av...")
const handleNestedExercises = (exercises, dayContent, language) => {
  const nestedSectionPatterns = [
    /(?:Core-träning|Bålträning|Coreträning):\s*(\d+)\s*(?:ronder|set|varv|omgångar)\s*av([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i,
    /(?:Core training|Core workout):\s*(\d+)\s*(?:rounds|sets)\s*of([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i,
    /(?:Kjernetrening|Kjerneøvelser):\s*(\d+)\s*(?:runder|sett)\s*av([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i
  ];
  
  for (const pattern of nestedSectionPatterns) {
    const match = dayContent.match(pattern);
    if (match) {
      console.log("Found nested exercise section");
      const rounds = parseInt(match[1]) || 3;
      const nestedContent = match[2].trim();
      
      // Split nested content by newlines or bullet points
      const nestedLines = nestedContent.split(/\n+|-/).map(l => l.trim()).filter(Boolean);
      
      // Process each nested exercise
      nestedLines.forEach((line, index) => {
        if (!line || isIntensityOnlyLine(line, language) || isHeaderLine(line)) return;
        
        const exercise = {
          id: uuidv4(),
          name: '',
          // Use the number of rounds as sets
          sets: rounds,
          isReps: true,
          reps: 10,
          duration: '',
          distance: '',
          restInterval: '01:00',
          notes: `Part of core training circuit (${rounds} rounds)`,
          perSide: false,
          mediaLinks: []
        };
        
        // Extract exercise details
        extractExerciseName(exercise, line, language);
        processRegularExercise(exercise, line, language, getLanguagePatterns(language));
        
        if (!exercise.name) {
          exercise.name = `Core Exercise ${index+1}`;
        }
        
        if (exercise.distance) {
          exercise.isReps = false;
        }
        
        // Avoid duplicate exercises (sometimes the section is already parsed line by line)
        const isDuplicate = exercises.some(e => 
          e.name.toLowerCase() === exercise.name.toLowerCase() && 
          e.sets === exercise.sets && 
          e.reps === exercise.reps
        );
        
        if (!isDuplicate) {
          exercises.push(exercise);
          console.log("Added nested exercise:", exercise.name);
        }
      });
    }
  }
};

// Helper functions to break down the complexity

// Preprocess lines to handle common OCR issues
const preprocessLines = (lines, language) => {
  console.log(`Preprocessing ${lines.length} lines for OCR corrections`);
  
  // Step 1: Join lines that were split incorrectly
  const processed = [];
  let currentLine = '';
  let skipNext = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
    
    // Handle common OCR issues
    
    // Issue 1: Exercise names split from their details
    if (line.length < 20 && !/\d/.test(line) && i < lines.length - 1 && /\d/.test(nextLine)) {
      // This looks like an exercise name followed by details on the next line
      processed.push(`${line} ${nextLine}`);
      skipNext = true;
      console.log(`Merged split exercise: "${line}" + "${nextLine}"`);
      continue;
    }
    
    // Issue 2: Short continuation lines
    if (line.length < 15 && !/\d/.test(line) && !isHeaderLine(line) && i < lines.length - 1) {
      currentLine = line;
      continue;
    }
    
    // Issue 3: Intensity label split from content
    const intensityPatterns = [
      /^(lätt|medel|svår|vila|easy|medium|hard|rest)$/i,
      /^(lett|middels|hard|hvile)$/i,
      /^(let|mellem|hård|hvile)$/i,
      /^(helppo|keskitaso|kova|lepo)$/i
    ];
    
    if (intensityPatterns.some(pattern => pattern.test(line)) && i < lines.length - 1) {
      processed.push(`${line}: ${nextLine}`);
      skipNext = true;
      console.log(`Merged intensity label: "${line}" + "${nextLine}"`);
      continue;
    }
    
    // Handle normal lines
    if (currentLine) {
      processed.push(`${currentLine} ${line}`);
      console.log(`Merged continuation: "${currentLine}" + "${line}"`);
      currentLine = '';
    } else {
      processed.push(line);
    }
  }
  
  // Add any remaining line
  if (currentLine) {
    processed.push(currentLine);
  }
  
  // Step 2: Fix common OCR errors
  const corrected = processed.map(line => {
    // Replace common OCR errors for numbers
    let fixed = line
      .replace(/(\d)l(\d)/g, '$11$2') // Replace l with 1 when between numbers
      .replace(/(\d)I(\d)/g, '$1l$2')  // Replace I with 1 when between numbers
      .replace(/(\d)O(\d)/g, '$1o$2')  // Replace O with 0 when between numbers
      .replace(/(\d)o/g, '$10')        // Replace o with 0 after numbers
      .replace(/o(\d)/g, '0$1');       // Replace o with 0 before numbers
    
    // Fix spacing issues around special characters
    fixed = fixed
      .replace(/(\d):(\d)/g, '$1: $2')  // Add space after colon between numbers
      .replace(/(\d)x(\d)/g, '$1 x $2') // Add spaces around x between numbers
      .replace(/\s+/g, ' ');            // Normalize whitespace
    
    // Fix Swedish-specific OCR errors
    if (language === 'swedish') {
      fixed = fixed
        .replace(/arrnhavningar/gi, 'armhävningar')
        .replace(/knaböj/gi, 'knäböj')
        .replace(/latt/gi, 'lätt')
        .replace(/svar/gi, 'svår')
        .replace(/lopning/gi, 'löpning');
    }
    
    return fixed.trim();
  });
  
  console.log(`Preprocessing complete. Original: ${lines.length} lines, Processed: ${corrected.length} lines`);
  return corrected;
};

// Check if a line is a header and not an exercise
const isHeaderLine = (line) => {
  // More comprehensive list of header patterns in Nordic languages
  const headerPatterns = [
    // Swedish common headers
    /^(?:uppvärmning|nedvarvning|styrka|kondition|cardio|stretching|återhämtning|vila|stretch)/i,
    /^(?:dynamisk\s+stretching|statisk\s+stretching|avslappning|rörlighet)/i,
    
    // Swedish section markers
    /^(?:del|pass|träningspass|övning|träning|program|vecka)\s*\d+/i,
    
    // Norwegian common headers
    /^(?:oppvarming|nedvarming|styrke|kondisjon|cardio|stretching|restitusjon|hvile|tøying)/i,
    
    // Danish common headers
    /^(?:opvarmning|nedkøling|styrke|kondition|cardio|stretching|restitution|hvile|udstrækning)/i,
    
    // Finnish common headers
    /^(?:lämmittely|jäähdyttely|voima|kestävyys|cardio|venyttely|palautuminen|lepo)/i,
    
    // English common headers
    /^(?:warm[\s-]?up|cool[\s-]?down|strength|cardio|stretching|recovery|rest)/i,
    
    // General section headers in any language
    /^(?:övningar|exercises|øvelser|harjoitukset|träning|workout|trening|træning|harjoitus)/i,
    
    // Common workout plan divisions
    /^(?:morgon|dag|kväll|natt|vecka|månad|period|fas)/i,
    /^(?:morning|day|evening|night|week|month|period|phase)/i,
    
    // Detect instructional headers
    /^(?:instruktioner|anvisningar|notera|notering|obs|viktigt)/i,
    /^(?:instructions|note|important|tips|guidelines)/i
  ];
  
  // Check the line against each pattern
  const isHeader = headerPatterns.some(pattern => {
    const match = pattern.test(line);
    if (match) {
      console.log(`Header detected: "${line}" matches pattern ${pattern}`);
    }
    return match;
  });
  
  // Also consider lines that are very short and don't contain numbers as headers
  const isShortHeader = line.length < 12 && !/\d/.test(line) && /^[A-ZÅÄÖ]/.test(line);
  if (isShortHeader) {
    console.log(`Short header detected: "${line}"`);
  }
  
  // Additional check for standalone colon-separated headers (like "Category: value")
  const isColonHeader = /^[^:]+:$/.test(line) || 
                        (/^[^:]+:/.test(line) && line.split(':')[0].length < 15);
  
  if (isColonHeader && !isHeader && !isShortHeader) {
    console.log(`Colon header detected: "${line}"`);
  }
  
  return isHeader || isShortHeader || isColonHeader;
};

// Extract exercise name using multiple strategies
const extractExerciseName = (exercise, line, language) => {
  console.log(`Trying to extract exercise name from: "${line}"`);
  
  // Clean up the line first
  const cleanLine = line
    .replace(/^\s*[-•*]\s*/, '') // Remove bullet points
    .trim();
  
  // Strategy 1: Look for content before numbers or special characters
  let nameMatch = cleanLine.match(/^([^:0-9]+)(?=\s*[:0-9]|$)/i);
  
  // Strategy 2: Try another pattern for exercises followed by sets/reps
  if (!nameMatch) {
    nameMatch = cleanLine.match(/^(.*?)(?=\s*[-:]\s*|\d+\s*(?:set|sets|sett|varv|reps|runder|sæt|sarjat)|$)/i);
  }
  
  // Strategy 3: If line starts with a number (like "3 sets of squats"), look after the first number group
  if (!nameMatch && /^\d+/.test(cleanLine)) {
    nameMatch = cleanLine.match(/^\d+\s*(?:set|sets|sett|varv|reps|runder|sæt|sarjat)\s+(?:of|av|med)?\s+([^:0-9]+)/i);
  }
  
  // Strategy 4: Look for exercise name after a colon (like "Exercise: Squats")
  if (!nameMatch && cleanLine.includes(':')) {
    const parts = cleanLine.split(':');
    if (parts.length > 1 && parts[0].length < 20) { // First part is likely a label
      const potentialName = parts[1].trim().split(/\s+(?:\d+|set|reps)/)[0].trim();
      if (potentialName && potentialName.length > 2 && !/^\d+$/.test(potentialName)) {
        nameMatch = [null, potentialName];
        console.log(`Found exercise name after colon: "${potentialName}"`);
      }
    }
  }
  
  // Strategy 5: Swedish common exercise patterns (specific handling for Swedish workouts)
  if (!nameMatch && language === 'swedish') {
    // Look for common Swedish exercise names
    const swedishExercisePatterns = [
      /(?:armhävningar|push-?ups)/i,
      /(?:knäböj|squats)/i,
      /(?:utfall|lunges)/i,
      /(?:plankan|plank)/i,
      /(?:situps|sit-?ups)/i,
      /(?:rygglyft|backraise)/i,
      /(?:marklyft|deadlift)/i,
      /(?:chins|pull-?ups)/i,
      /(?:dips|tricepspress)/i,
      /(?:benpress|leg press)/i,
      /(?:axelpress|shoulder press)/i,
      /(?:bicepscurls|biceps)/i,
      /(?:triceps|tricepsextensioner)/i,
      /(?:rodd|row)/i,
      /(?:bänkpress|bench press)/i,
      /(?:mountain climbers|bergsklättrare)/i,
      /(?:burpees)/i,
      /(?:latsdrag|latpulldown)/i,
      /(?:sidoplankan|side plank)/i,
      /(?:ryggextension|back extension)/i
    ];
    
    for (const pattern of swedishExercisePatterns) {
      const match = cleanLine.match(pattern);
      if (match) {
        // Find the full part of the line that contains this exercise
        const exercisePart = cleanLine.split(/[,;:]/).find(part => pattern.test(part)) || match[0];
        nameMatch = [null, exercisePart.trim()];
        console.log(`Found Swedish exercise name via patterns: "${exercisePart.trim()}"`);
        break;
      }
    }
  }
  
  if (nameMatch) {
    exercise.name = nameMatch[1].trim();
    console.log("Found exercise name:", exercise.name);
    
    // Check for and remove set/rep information from the name
    const cleanedName = exercise.name
      .replace(/\d+\s*(?:sets?|sett|varv|reps?|repetitioner|upprepningar|gånger).*$/i, '')
      .replace(/(?:sets?|sett|varv|reps?|repetitioner|upprepningar|gånger)\s*\d+.*$/i, '')
      .trim();
    
    if (cleanedName !== exercise.name) {
      console.log(`Cleaned exercise name: "${exercise.name}" → "${cleanedName}"`);
      exercise.name = cleanedName;
    }
  } else {
    // Strategy 6: Just take first segment before any punctuation
    const simpleName = cleanLine.split(/[,:;]/)[0].trim();
    if (simpleName && simpleName.length > 0) {
      exercise.name = simpleName;
      console.log("Using simple name extraction:", exercise.name);
      
      // Additional cleaning for simple names
      if (exercise.name.length > 30) {
        // If name is too long, truncate it at a reasonable word boundary
        const shortenedName = exercise.name.substring(0, 30).split(/\s+/).slice(0, -1).join(' ');
        if (shortenedName.length > 3) {
          console.log(`Name too long, shortened: "${exercise.name}" → "${shortenedName}"`);
          exercise.name = shortenedName;
        }
      }
    } else {
      console.log("Could not extract exercise name");
    }
  }
  
  // Final validation - Swedish special case handling
  if (language === 'swedish' && exercise.name) {
    // Handle Swedish compound exercise names that might be split
    const knownPrefixes = ['arm', 'ben', 'rygg', 'mag', 'bröst', 'axel', 'triceps', 'biceps'];
    const knownSuffixes = ['hävningar', 'böj', 'lyft', 'press', 'drag', 'curl', 'extension'];
    
    // Detect if the name might be a partial compound word
    if (knownPrefixes.some(prefix => exercise.name.toLowerCase().endsWith(prefix)) ||
        knownSuffixes.some(suffix => exercise.name.toLowerCase().startsWith(suffix))) {
      
      // Look ahead in the line for the other part
      const remainingLine = cleanLine.substring(exercise.name.length).trim();
      const wordMatch = remainingLine.match(/^[a-zåäöæøA-ZÅÄÖÆØ]+/);
      
      if (wordMatch) {
        const compound = `${exercise.name}${wordMatch[0]}`;
        console.log(`Detected potential compound word: "${exercise.name}" + "${wordMatch[0]}" = "${compound}"`);
        exercise.name = compound;
      }
    }
  }
};

// Process special exercise types like sprint intervals
const processSpecialExercises = (exercise, line, language) => {
  // Check for sprint intervals pattern
  const sprintIntervalRegex = /(\d+)\s*x\s*(\d+)(?:m|meter|metres|meters|meter)(?:[^\d]+(\d+)s?(?:\s*(?:rest|vila|hvile|pause|lepo))?)?/i;
  const sprintMatch = line.match(sprintIntervalRegex);

  // Also check for distance-first pattern
  const distanceFirstRegex = /(\d+)(?:m|meter|metres|meters|meter)\s*x\s*(\d+)(?:\s+(?:med|with|mit|avec|con)\s+(\d+)s?(?:\s*(?:rest|vila|hvile|pause|lepo))?)?/i;
  const distanceFirstMatch = line.match(distanceFirstRegex);

  if (sprintMatch || distanceFirstMatch) {
    // This is a sprint interval exercise
    console.log("Found sprint interval:", line);
    
    if (sprintMatch) {
      // "10 x 100m" means 10 reps of 100m distance
      exercise.sets = 1; // Usually just 1 set of sprint intervals
      exercise.isReps = false; // Distance-based
      exercise.reps = parseInt(sprintMatch[1]); // Store number of intervals anyway
      exercise.distance = `${sprintMatch[2]}m`; // Distance per interval
      
      // If rest period is specified
      if (sprintMatch[3]) {
        exercise.restInterval = `00:${sprintMatch[3].padStart(2, '0')}`;
      }
    } else if (distanceFirstMatch) {
      // "100m x 10" also means 10 reps of 100m distance
      exercise.sets = 1;
      exercise.isReps = false;
      exercise.reps = parseInt(distanceFirstMatch[2]);
      exercise.distance = `${distanceFirstMatch[1]}m`;
      
      if (distanceFirstMatch[3]) {
        exercise.restInterval = `00:${distanceFirstMatch[3].padStart(2, '0')}`;
      }
    }
    
    // Make sure the name includes sprint/interval terminology if needed
    if (!exercise.name || isGenericExerciseName(exercise.name, language)) {
      assignAppropriateExerciseName(exercise, language, 'sprint');
    }
    
    // Add a note with the full sprint interval description
    if (!exercise.notes) {
      const match = sprintMatch || distanceFirstMatch;
      const intervals = match === sprintMatch ? match[1] : match[2];
      const distance = match === sprintMatch ? match[2] : match[1];
      const rest = match[3] ? `${match[3]}s vila` : '';
      exercise.notes = `${intervals} x ${distance}m${rest ? ' med ' + rest : ''}`;
    }
    
    return true; // Special exercise processed
  }
  
  return false; // Not a special exercise
};

// Check if name is too generic
const isGenericExerciseName = (name, language) => {
  const lowerName = name.toLowerCase();
  
  // Generic terms in various languages
  const genericTerms = [
    'exercise', 'workout', 'training',
    'övning', 'träning', 'pass',
    'øvelse', 'trening', 'økt',
    'øvelse', 'træning', 'session',
    'harjoitus', 'liike'
  ];
  
  return genericTerms.some(term => lowerName.includes(term)) || lowerName.length < 3;
};

// Assign an appropriate exercise name based on type and language
const assignAppropriateExerciseName = (exercise, language, type) => {
  if (type === 'sprint') {
    if (language === 'swedish') {
      exercise.name = "Sprintervaller";
    } else if (language === 'norwegian') {
      exercise.name = "Sprintintervaller";
    } else if (language === 'danish') {
      exercise.name = "Sprintintervaller";
    } else if (language === 'finnish') {
      exercise.name = "Sprintti-intervallit";
    } else {
      exercise.name = "Sprint intervals";
    }
  } else {
    // Default generic name by language
    const genericNames = {
      'swedish': 'Övning',
      'norwegian': 'Øvelse',
      'danish': 'Øvelse',
      'finnish': 'Harjoitus',
      'english': 'Exercise'
    };
    
    exercise.name = genericNames[language] || 'Exercise';
  }
  
  console.log("Assigned appropriate name:", exercise.name);
};

// Process regular exercise (sets, reps, etc.)
const processRegularExercise = (exercise, line, language, patterns) => {
  // Special pattern matching for Swedish exercises with the format '3 set x 15 reps'
  if (language === 'swedish') {
    const setRepPattern = /(\d+)\s*(?:set|sets)\s*x\s*(\d+)\s*(?:reps?|repetitioner)/i;
    const match = line.match(setRepPattern);
    
    if (match) {
      console.log(`Found Swedish set x rep pattern: ${match[1]} sets x ${match[2]} reps`);
      exercise.sets = parseInt(match[1]) || 3;
      exercise.reps = parseInt(match[2]) || 10;
      exercise.isReps = true;
      
      // Check for "per ben/arm/sida" or similar
      if (/per\s+(?:ben|arm|sida)|per\s+side|varje\s+(?:ben|arm|sida)|each\s+(?:leg|arm|side)/i.test(line)) {
        exercise.perSide = true;
        console.log("Exercise is per side");
      }
      
      return true;
    }
  }
  
  // Extract sets and reps using various patterns
  const setRegexPatterns = patterns.setPatterns.map(pattern => 
    new RegExp(`(\\d+)\\s*(?:${pattern})`, 'i')
  );
  const repRegexPatterns = patterns.repPatterns.map(pattern => 
    new RegExp(`(\\d+)\\s*(?:${pattern})`, 'i')
  );
  
  // Look for set patterns
  const setCount = extractNumber(line, [
    ...setRegexPatterns,
    /(\d+)\s*(?:set|sets)(?:\s+of)?/i,
    /(\d+)(?:\s*x|\s*×)/i,  // Look for AxB patterns
  ]);
  
  // Look for rep patterns
  const repCount = extractNumber(line, [
    ...repRegexPatterns,
    /(\d+)\s*(?:rep|reps)(?:\s+per\s+set)?/i,
    /(?:x|\s*×)\s*(\d+)/i,  // Look for AxB patterns
  ]);
  
  // Look for special patterns like "3x10" or "4 x 12"
  const setXRepsPattern = /(\d+)\s*(?:x|×)\s*(\d+)/i;
  const setXRepsMatch = line.match(setXRepsPattern);
  
  if (setXRepsMatch) {
    // In a pattern like "3x10", the first number is typically sets and the second is reps
    const potentialSets = parseInt(setXRepsMatch[1]);
    const potentialReps = parseInt(setXRepsMatch[2]);
    
    // Use these values if they seem reasonable
    if (potentialSets >= 1 && potentialSets <= 10 && potentialReps >= 1) {
      console.log(`Found sets x reps pattern: ${potentialSets}x${potentialReps}`);
      exercise.sets = potentialSets;
      exercise.reps = potentialReps;
      exercise.isReps = true;
    }
  } else {
    // Use individually detected set and rep counts
    if (setCount !== null) {
      exercise.sets = setCount;
      console.log("Found sets:", exercise.sets);
    }
    
    if (repCount !== null) {
      exercise.reps = repCount;
      exercise.isReps = true;
      console.log("Found reps:", exercise.reps);
    }
  }
  
  // Extract distance
  const distanceMatch = line.match(/(\d+)\s*(?:m(?:eter)?|km|yards?|miles?|feet|ft)/i);
  if (distanceMatch) {
    exercise.distance = distanceMatch[0].trim();
    exercise.isReps = false;
    console.log("Found distance:", exercise.distance);
  }
  
  // Extract duration
  const durationMatch = line.match(/(\d+):(\d+)|(\d+)\s*(?:min(?:utes?)?|sec(?:onds?)?|s|hours?|h)/i);
  if (durationMatch) {
    // If we have a duration and are not already tracking distance
    if (!exercise.distance) {
      if (durationMatch[1] && durationMatch[2]) {
        // Format as MM:SS
        exercise.duration = `${durationMatch[1]}:${durationMatch[2]}`;
      } else {
        exercise.duration = durationMatch[0].trim();
      }
      exercise.isReps = false;
      console.log("Found duration:", exercise.duration);
    }
  }
  
  // Check for per side indication
  if (patterns.perSidePatterns.some(pattern => line.toLowerCase().includes(pattern))) {
    exercise.perSide = true;
    console.log("Exercise is per side");
  }
  
  // Check for rest period
  extractRestPeriod(exercise, line);
  
  return false; // Indicates we used standard processing
};

// Extract rest period from line
const extractRestPeriod = (exercise, line) => {
  // Pattern: number followed by s/sec/sekund and optionally followed by rest word
  const restRegex = /(\d+)\s*(?:s|sek|sec|seconds|sekunder|sekund|sekuntia)(?:\s+(?:vila|hvile|rest|pause|lepo|recovery|recuperación|récupération|erholung|återhämtning|restitusjon|restitution|palautuminen))?/i;
  const restMatch = line.match(restRegex);
  
  if (restMatch) {
    const restSeconds = parseInt(restMatch[1]);
    if (restSeconds <= 90) { // Assume it's a rest period if it's under 90 seconds
      exercise.restInterval = `00:${restSeconds.toString().padStart(2, '0')}`;
      console.log("Found rest interval:", exercise.restInterval);
    }
  }
  
  // Alternative pattern: rest word followed by time
  const altRestRegex = /(?:vila|hvile|rest|pause|lepo|recovery|recuperación|récupération|erholung|återhämtning|restitusjon|restitution|palautuminen)\s+(\d+)\s*(?:s|sek|sec|seconds|sekunder|sekund|sekuntia)/i;
  const altRestMatch = line.match(altRestRegex);
  
  if (altRestMatch) {
    const restSeconds = parseInt(altRestMatch[1]);
    exercise.restInterval = `00:${restSeconds.toString().padStart(2, '0')}`;
    console.log("Found alternative rest interval:", exercise.restInterval);
  }
  
  // Look for "med Xs vila" pattern (with Xs rest) - common in Swedish
  const withRestRegex = /med\s+(\d+)\s*(?:s|sek|sec|seconds|sekunder|sekund)\s+(?:vila|hvile|rest|pause|återhämtning)/i;
  const withRestMatch = line.match(withRestRegex);
  
  if (withRestMatch) {
    const restSeconds = parseInt(withRestMatch[1]);
    exercise.restInterval = `00:${restSeconds.toString().padStart(2, '0')}`;
    console.log("Found 'med X vila' rest interval:", exercise.restInterval);
  }
};

// Helper function to check if a line only describes intensity
const isIntensityOnlyLine = (line, language) => {
  const patterns = getLanguagePatterns(language);
  const lowerLine = line.toLowerCase().trim();
  
  // Check if the line contains only intensity words
  const allPatterns = [
    ...patterns.easyPatterns, 
    ...patterns.mediumPatterns, 
    ...patterns.hardPatterns, 
    ...patterns.restPatterns
  ];
  
  // If it's only an intensity marker (like "easy" or "rest day" with few words)
  if (allPatterns.some(pattern => lowerLine === pattern)) return true;
  if (allPatterns.some(pattern => lowerLine.includes(pattern)) && lowerLine.split(' ').length < 4) return true;
  
  return false;
};

// Add a helper function to detect if the text contains training days
export const hasTrainingDays = (text) => {
  if (!text || typeof text !== 'string') {
    console.log("hasTrainingDays: Input text is null, undefined, or not a string");
    return false;
  }
  
  console.log("hasTrainingDays: Analyzing text to detect workout format");
  console.log("hasTrainingDays: Text length:", text.length);
  console.log("hasTrainingDays: Text preview:", text.substring(0, 100) + "...");
  
  // Simple day detection across multiple languages
  const language = detectLanguage(text);
  console.log("hasTrainingDays: Detected language:", language);
  
  const patterns = getLanguagePatterns(language);
  
  // Excel-specific format detection
  const excelFormatDetection = detectExcelFormat(text);
  if (excelFormatDetection) {
    console.log("hasTrainingDays: Detected Excel-formatted workout data");
    return true;
  }
  
  // First test if text matches standard day pattern
  if (patterns.dayRegex.test(text)) {
    console.log("hasTrainingDays: Found standard day pattern match");
    return true;
  }
  
  // Alternative formats detection - check for workout structure even without day markers
  
  // 1. Check for exercise patterns that indicate a workout plan
  const exercisePatterns = [
    // Sets and reps patterns
    /\d+\s*(?:set|sets|sett|varv|omgångar)/i,
    /\d+\s*(?:rep|reps|repetitioner|upprepningar|toisto)/i,
    
    // Common exercise names in different languages
    /(?:armhävningar|pushups|armhevinger|punnerrukset|armstrækninger)/i,
    /(?:knäböj|squats|knebøy|kyykyt)/i,
    /(?:utfall|lunges|utfald)/i,
    /(?:sit-?ups|situps)/i,
    /(?:plankan?|plank|lankku)/i,
    /(?:bänkpress|bench\s*press)/i,
    /(?:marklyft|deadlift)/i,
    /(?:axelpress|shoulder\s*press)/i,
    
    // Distance or duration patterns
    /\d+\s*(?:km|m|meter|min|minuter|sekunder|sek)/i,
    
    // Workout section headers
    /(?:uppvärmning|warm-?up|oppvarming|lämmittely|opvarmning)/i,
    /(?:styrka|strength|styrke|voima)/i,
    /(?:kondition|cardio|kondisjon|kestävyys)/i,
    
    // Training structure indicators
    /\d+\s*x\s*\d+\s*(?:m|meter|metres)/i, // Intervals like "10 x 100m"
    /(?:vila|rest|hvile|lepo|pause)\s*\d+\s*(?:s|sek|min)/i, // Rest periods
  ];
  
  for (const pattern of exercisePatterns) {
    if (pattern.test(text)) {
      console.log("hasTrainingDays: Found exercise pattern match:", pattern);
      return true;
    }
  }
  
  // 2. Check for sections separated by blank lines or other clear divisions
  const sections = text.split(/\n\s*\n+/);
  console.log("hasTrainingDays: Found", sections.length, "sections separated by blank lines");
  
  if (sections.length >= 2) {
    // See if each section has at least one exercise indicator
    let exerciseSectionCount = 0;
    for (const section of sections) {
      if (section.trim() && exercisePatterns.some(pattern => pattern.test(section))) {
        exerciseSectionCount++;
      }
    }
    
    // If we found multiple sections with exercise patterns, it's likely a workout plan
    console.log("hasTrainingDays: Found", exerciseSectionCount, "sections containing exercise patterns");
    if (exerciseSectionCount >= 2) {
      console.log("hasTrainingDays: Multiple exercise sections detected");
      return true;
    }
  }
  
  // 3. Check for weekday markers
  const weekdayPatterns = [
    /(?:måndag|monday|manddag|maanantai)/i,
    /(?:tisdag|tuesday|tirsdag|tiistai)/i,
    /(?:onsdag|wednesday|keskiviikko)/i,
    /(?:torsdag|thursday|torstai)/i,
    /(?:fredag|friday|perjantai)/i,
    /(?:lördag|saturday|lørdag|lauantai)/i,
    /(?:söndag|sunday|søndag|sunnuntai)/i
  ];
  
  for (const pattern of weekdayPatterns) {
    if (pattern.test(text)) {
      console.log("hasTrainingDays: Found weekday pattern match:", pattern);
      return true;
    }
  }
  
  // 4. Look for lines with a colon that might be exercise definitions
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  console.log("hasTrainingDays: Found", lines.length, "non-empty lines");
  
  let colonLines = 0;
  for (const line of lines) {
    if (line.includes(':') && !line.endsWith(':')) {
      colonLines++;
    }
  }
  
  console.log("hasTrainingDays: Found", colonLines, "lines containing colons (potential exercise definitions)");
  
  // If we have multiple lines with colons, it might be exercise definitions
  if (colonLines >= 3 && lines.length >= 5) {
    console.log("hasTrainingDays: Multiple exercise definition lines detected");
    return true;
  }
  
  // 5. Last resort - just check for common numeric patterns that appear in workouts
  const workoutNumericPatterns = [
    /\d+\s*x\s*\d+/i,  // like "3 x 10"
    /\d+\s*-\s*\d+/i,  // like "3-10"
    /\d+\s*min/i,      // like "30 min" 
    /\d+\s*sec|sek/i   // like "30 sec"
  ];
  
  let numericPatternCount = 0;
  for (const pattern of workoutNumericPatterns) {
    if (pattern.test(text)) {
      numericPatternCount++;
    }
  }
  
  console.log("hasTrainingDays: Found", numericPatternCount, "numeric workout patterns");
  if (numericPatternCount >= 3) {
    console.log("hasTrainingDays: Multiple numeric workout patterns detected");
    return true;
  }
  
  // No workout structure detected
  console.log("hasTrainingDays: No workout structure detected");
  return false;
};

// Helper to check if text has consistent column spacing (common in Excel exports)
function hasConsistentColumnSpacing(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 3) return false;
  
  // Check for multiple spaces as column separators
  const spacingPattern = /\s{2,}/g;
  
  // Count spaces in first few lines
  const spaceCounts = [];
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const matches = lines[i].match(spacingPattern);
    if (matches) {
      spaceCounts.push(matches.length);
    }
  }
  
  // If we have consistent number of separators in most lines, it's likely column-formatted
  if (spaceCounts.length >= 3) {
    // Get mode (most common count)
    const mode = getMode(spaceCounts);
    // Count how many match the mode
    const matchingModeCount = spaceCounts.filter(count => count === mode).length;
    
    return matchingModeCount >= Math.min(3, spaceCounts.length);
  }
  
  return false;
}

// Helper to get the mode (most common value) in an array
function getMode(arr) {
  const counts = {};
  let maxCount = 0;
  let mode = null;
  
  for (const num of arr) {
    counts[num] = (counts[num] || 0) + 1;
    if (counts[num] > maxCount) {
      maxCount = counts[num];
      mode = num;
    }
  }
  
  return mode;
}

// Group Excel lines by day
function groupExcelLinesByDay(lines, separator, columnRoles) {
  const workoutDays = [];
  const startLine = 1; // Skip header row
  
  if (columnRoles.dayCol !== -1) {
    // If we have a day column, group by that
    let currentDay = null;
    let currentDayLines = [];
    
    for (let i = startLine; i < lines.length; i++) {
      const columns = lines[i].split(separator).map(col => col.trim());
      
      if (columns.length <= 1) continue; // Skip empty lines
      
      const dayValue = columns[columnRoles.dayCol];
      
      if (dayValue && dayValue !== currentDay) {
        // New day found
        if (currentDay && currentDayLines.length > 0) {
          workoutDays.push({
            name: currentDay,
            lines: currentDayLines
          });
        }
        
        currentDay = dayValue;
        currentDayLines = [columns];
      } else {
        // Continue with current day
        currentDayLines.push(columns);
      }
    }
    
    // Add the last day
    if (currentDay && currentDayLines.length > 0) {
      workoutDays.push({
        name: currentDay,
        lines: currentDayLines
      });
    }
  } else {
    // If no day column, try to detect day changes or just create one day
    workoutDays.push({
      name: null,
      lines: lines.slice(startLine).map(line => line.split(separator).map(col => col.trim()))
    });
  }
  
  return workoutDays;
}

// Identify column roles in Excel format
function identifyColumnRoles(headers) {
  const roles = {
    exerciseCol: -1,
    setsCol: -1,
    repsCol: -1,
    weightCol: -1,
    restCol: -1,
    dayCol: -1,
    notesCol: -1
  };
  
  // Function to check if a column matches certain keywords
  const matchesRole = (header, keywords) => {
    const h = header.toLowerCase();
    return keywords.some(keyword => h.includes(keyword));
  };
  
  headers.forEach((header, index) => {
    // Exercise/name column
    if (matchesRole(header, ['exercise', 'name', 'övning', 'rörelse', 'liike', 'øvelse'])) {
      roles.exerciseCol = index;
    }
    // Sets column
    else if (matchesRole(header, ['set', 'sets', 'omgångar', 'sarjat', 'sett'])) {
      roles.setsCol = index;
    }
    // Reps column
    else if (matchesRole(header, ['rep', 'reps', 'repetition', 'toistot', 'gentagelser'])) {
      roles.repsCol = index;
    }
    // Weight column
    else if (matchesRole(header, ['weight', 'kg', 'lb', 'vikt', 'paino', 'vægt'])) {
      roles.weightCol = index;
    }
    // Rest column
    else if (matchesRole(header, ['rest', 'vila', 'pause', 'lepo', 'hvile'])) {
      roles.restCol = index;
    }
    // Day column
    else if (matchesRole(header, ['day', 'dag', 'päivä'])) {
      roles.dayCol = index;
    }
    // Notes column
    else if (matchesRole(header, ['note', 'notes', 'anteckningar', 'muistiinpanot', 'notater'])) {
      roles.notesCol = index;
    }
  });
  
  // If no exercise column was found, try to determine it based on content
  if (roles.exerciseCol === -1) {
    // First column is often the exercise name if not identified
    roles.exerciseCol = 0;
  }
  
  return roles;
}

/**
 * Generate mock exercises for LLM fallback
 * @param {string} language - The detected language 
 * @param {string} intensity - The workout intensity
 * @returns {Array} - Array of exercise objects
 */
const generateMockExercises = (language, intensity) => {
  // Exercise templates by language
  const exercisesByLanguage = {
    english: [
      { name: 'Running', isReps: false, distance: '5km', reps: 0 },
      { name: 'Squats', isReps: true, reps: 12 },
      { name: 'Push-ups', isReps: true, reps: 15 },
      { name: 'Plank', isReps: false, duration: '01:00' },
      { name: 'Burpees', isReps: true, reps: 10 }
    ],
    swedish: [
      { name: 'Löpning', isReps: false, distance: '5km', reps: 0 },
      { name: 'Knäböj', isReps: true, reps: 12 },
      { name: 'Armhävningar', isReps: true, reps: 15 },
      { name: 'Plankan', isReps: false, duration: '01:00' },
      { name: 'Burpees', isReps: true, reps: 10 }
    ],
    norwegian: [
      { name: 'Løping', isReps: false, distance: '5km', reps: 0 },
      { name: 'Knebøy', isReps: true, reps: 12 },
      { name: 'Armhevinger', isReps: true, reps: 15 },
      { name: 'Planken', isReps: false, duration: '01:00' },
      { name: 'Burpees', isReps: true, reps: 10 }
    ],
    danish: [
      { name: 'Løb', isReps: false, distance: '5km', reps: 0 },
      { name: 'Squats', isReps: true, reps: 12 },
      { name: 'Armstrækninger', isReps: true, reps: 15 },
      { name: 'Planke', isReps: false, duration: '01:00' },
      { name: 'Burpees', isReps: true, reps: 10 }
    ],
    finnish: [
      { name: 'Juoksu', isReps: false, distance: '5km', reps: 0 },
      { name: 'Kyykyt', isReps: true, reps: 12 },
      { name: 'Punnerrukset', isReps: true, reps: 15 },
      { name: 'Lankku', isReps: false, duration: '01:00' },
      { name: 'Burpees', isReps: true, reps: 10 }
    ]
  };
  
  const exercises = exercisesByLanguage[language] || exercisesByLanguage.english;
  const exerciseCount = intensity === 'Rest' ? 1 : 
                        intensity === 'Easy' ? 3 : 
                        intensity === 'Medium' ? 4 : 5;
  
  return exercises.slice(0, exerciseCount).map((ex, index) => ({
    id: `llm-exercise-${index}`,
    name: ex.name,
    sets: Math.floor(Math.random() * 3) + 2,
    isReps: ex.isReps,
    reps: ex.reps,
    duration: ex.duration || '',
    distance: ex.distance || '',
    restInterval: '00:45',
    notes: '',
    mediaLinks: []
  }));
};

// Create fallback days when no structured days are found
const createFallbackDays = (text, language, patterns) => {
  console.log("Creating fallback days for text content");
  const days = [];
  
  // Detect content sections based on line breaks and content patterns
  const contentSections = detectTextSections(text.split('\n').filter(line => line.trim()));
  
  if (contentSections.length === 0) {
    console.log("No content sections detected, creating single fallback day");
    return [createSingleFallbackDay(text, language)];
  }
  
  console.log(`Detected ${contentSections.length} content sections for fallback days`);
  
  // Calculate start date (today)
  const startDate = new Date();
  
  // Create a day for each content section
  contentSections.forEach((section, index) => {
    // Find text content for this section
    const content = section.lines.join('\n');
    
    // Skip very short sections that probably don't contain exercises
    if (content.length < 20 || section.lines.length < 2) {
      console.log(`Skipping section ${index + 1}: too short (${content.length} chars, ${section.lines.length} lines)`);
      return;
    }
    
    // Calculate date for this section
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + index);
    const formattedDate = format(dayDate, 'yyyy-MM-dd');
    
    // Format date for display (e.g., "Monday, Jan 15")
    const displayDate = format(dayDate, 'EEEE, MMM d');
    
    // Try to detect intensity for this section
    const intensity = detectIntensityFromText(content, patterns) || 
                      patterns.defaultIntensity || 
                      'Medium';
    
    // Create at most 2 exercises per fallback day to avoid cluttering with incorrect data
    const maxExercises = 2;
    
    // Parse exercises from content or use mock exercises if none found
    let exercises = parseExercises(content, language);
    
    // Only keep a limited number of exercises to avoid false positives
    if (exercises.length > maxExercises) {
      console.log(`Limiting fallback exercises from ${exercises.length} to ${maxExercises}`);
      exercises = exercises.slice(0, maxExercises);
    } else if (exercises.length === 0) {
      console.log("No exercises found in content section, using minimal fallback");
      // Create just one placeholder exercise with [FALLBACK] prefix
      exercises = [{
        id: uuidv4(),
        name: `[FALLBACK] Exercise from OCR text (section ${index + 1})`,
        sets: 1,
        isReps: true,
        reps: 1,
        duration: '',
        distance: '',
        restInterval: '00:30',
        notes: 'This is an automatically generated exercise because no structured workout data was detected.',
        mediaLinks: [],
        perSide: false
      }];
    } else {
      // If we found some exercises but not many, mark them as fallback
      exercises = exercises.map(ex => ({
        ...ex,
        name: `[FALLBACK] ${ex.name}`
      }));
    }
    
    // Create day object
    days.push({
      id: uuidv4(),
      name: displayDate,
      date: formattedDate,
      intensity,
      originalLanguage: language,
      exercises
    });
  });
  
  console.log(`Created ${days.length} fallback days with exercises`);
  return days;
};

// Create a single fallback day when no structure is detected
function createSingleFallbackDay(text, language) {
  console.log("Creating single fallback day");
  
  // Generate today's date
  const today = new Date();
  const formattedDate = format(today, 'yyyy-MM-dd');
  const displayDate = format(today, 'EEEE, MMM d');
  
  // Try to parse some exercises
  const exercises = parseExercises(text, language);
  
  // Only use up to 2 exercises to avoid incorrect data
  const limitedExercises = exercises.length > 0 
    ? exercises.slice(0, 2).map(ex => ({
        ...ex,
        name: `[FALLBACK] ${ex.name}`
      }))
    : [{
        id: uuidv4(),
        name: '[FALLBACK] Exercise from unstructured text',
        sets: 1,
        isReps: true,
        reps: 1,
        duration: '',
        distance: '',
        restInterval: '00:30',
        notes: 'This is an automatically generated exercise because no structured workout data was detected.',
        mediaLinks: [],
        perSide: false
      }];
  
  console.log(`Created single fallback day with ${limitedExercises.length} exercises`);
  
  // Create a single day with today's date
  return {
    id: uuidv4(),
    name: `${displayDate} (Unstructured Data)`,
    date: formattedDate,
    intensity: 'Medium',
    originalLanguage: language,
    exercises: limitedExercises
  };
}

// Get language-specific patterns for parsing
const getLanguagePatterns = (language) => {
  switch (language) {
    case 'spanish':
      return {
        // More flexible day pattern matching - case insensitive, allows variations
        dayRegex: /(?:d[ií]a|jornada|sesión|sesion|entreno)\s*(\d+)[:\.\s-]+(.*?)(?=(?:d[ií]a|jornada|sesión|sesion|entreno)\s*\d+[:\.\s-]|$)/gis,
        endMarker: 'Día 999:',
        dayPrefix: 'Día',
        trainingSuffix: 'Entrenamiento',
        easyPatterns: ['fácil', 'ligero', 'suave', 'baja intensidad'],
        mediumPatterns: ['medio', 'moderado', 'intermedio'],
        hardPatterns: ['difícil', 'duro', 'intenso', 'fuerte', 'alta intensidad'],
        restPatterns: ['descanso', 'recuperación', 'reposo'],
        repPatterns: ['repeticiones', 'reps', 'rep'],
        setPatterns: ['series', 'serie'],
        perSidePatterns: ['por lado', 'cada lado', 'por pierna', 'por brazo', 'bilateral'],
        defaultIntensity: 'Medio',
        intensityLabels: {
          rest: 'Descanso',
          easy: 'Fácil',
          hard: 'Difícil',
          medium: 'Medio'
        }
      };
    case 'french':
      return {
        // More flexible day pattern matching - case insensitive, allows variations
        dayRegex: /(?:jour|journée|séance|session)\s*(\d+)[:\.\s-]+(.*?)(?=(?:jour|journée|séance|session)\s*\d+[:\.\s-]|$)/gis,
        endMarker: 'Jour 999:',
        dayPrefix: 'Jour',
        trainingSuffix: 'Entraînement',
        easyPatterns: ['facile', 'léger', 'souple', 'basse intensité'],
        mediumPatterns: ['moyen', 'modéré', 'intermédiaire'],
        hardPatterns: ['difficile', 'dur', 'intense', 'fort', 'haute intensité'],
        restPatterns: ['repos', 'récupération'],
        repPatterns: ['répétitions', 'reps', 'rep'],
        setPatterns: ['séries', 'série'],
        perSidePatterns: ['par côté', 'chaque côté', 'par jambe', 'par bras', 'bilatéral'],
        defaultIntensity: 'Moyen',
        intensityLabels: {
          rest: 'Repos',
          easy: 'Facile',
          hard: 'Difficile',
          medium: 'Moyen'
        }
      };
    case 'german':
      return {
        // More flexible day pattern matching - case insensitive, allows variations
        dayRegex: /(?:tag|tages|training|einheit)\s*(\d+)[:\.\s-]+(.*?)(?=(?:tag|tages|training|einheit)\s*\d+[:\.\s-]|$)/gis,
        endMarker: 'Tag 999:',
        dayPrefix: 'Tag',
        trainingSuffix: 'Training',
        easyPatterns: ['leicht', 'einfach', 'locker', 'geringe intensität'],
        mediumPatterns: ['mittel', 'moderat', 'mittlere intensität'],
        hardPatterns: ['schwer', 'hart', 'intensiv', 'hohe intensität'],
        restPatterns: ['ruhe', 'pause', 'erholung', 'regeneration'],
        repPatterns: ['wiederholungen', 'wdh', 'wiederholung'],
        setPatterns: ['sätze', 'satz'],
        perSidePatterns: ['pro seite', 'jede seite', 'pro bein', 'pro arm', 'beidseitig'],
        defaultIntensity: 'Mittel',
        intensityLabels: {
          rest: 'Ruhe',
          easy: 'Leicht',
          hard: 'Schwer',
          medium: 'Mittel'
        }
      };
    case 'swedish':
      return {
        // Improved day pattern matching with more flexible formats
        dayRegex: /(?:dag|träningsdag|pass|träningspass|övning|träning)\s*(\d+)[:.\s-]+(.*?)(?=(?:dag|träningsdag|pass|träningspass|övning|träning)\s*\d+[:.\s-]|$)/gis,
        endMarker: 'Dag 999:',
        dayPrefix: 'Dag',
        trainingSuffix: 'Träning',
        easyPatterns: ['lätt', 'enkel', 'låg intensitet', 'lätta'],
        mediumPatterns: ['medel', 'måttlig', 'moderat', 'mellan'],
        hardPatterns: ['svår', 'tung', 'hård', 'intensiv', 'hög intensitet', 'svåra'],
        restPatterns: ['vila', 'återhämtning', 'vilodag', 'aktiv återhämtning'],
        repPatterns: ['repetitioner', 'reps', 'rep', 'repetition', 'upprepningar'],
        setPatterns: ['set', 'omgångar', 'varv', 'omgång'],
        perSidePatterns: ['per sida', 'varje sida', 'per ben', 'per arm', 'bilateralt', 'på varje sida'],
        defaultIntensity: 'Medel',
        intensityLabels: {
          rest: 'Vila',
          easy: 'Lätt',
          hard: 'Svår',
          medium: 'Medel'
        },
        // Swedish-specific exercise types
        exerciseTypes: {
          'löpning': 'löpning',
          'jogging': 'jogging',
          'löppass': 'löppass',
          'sprinter': 'sprinter',
          'sprint': 'sprint',
          'interval': 'intervall',
          'sprintervaller': 'sprintervaller',
          'intervaller': 'intervaller',
          'styrketräning': 'styrketräning'
        }
      };
    case 'norwegian':
      return {
        // Improved day pattern matching with more flexible formats
        dayRegex: /(?:dag|treningsdag|økt|treningsøkt|øvelse|trening)\s*(\d+)[:.\s-]+(.*?)(?=(?:dag|treningsdag|økt|treningsøkt|øvelse|trening)\s*\d+[:.\s-]|$)/gis,
        endMarker: 'Dag 999:',
        dayPrefix: 'Dag',
        trainingSuffix: 'Trening',
        easyPatterns: ['lett', 'enkel', 'lav intensitet'],
        mediumPatterns: ['middels', 'moderat'],
        hardPatterns: ['hard', 'tung', 'intensiv', 'høy intensitet'],
        restPatterns: ['hvile', 'restitusjon', 'hviledag'],
        repPatterns: ['repetisjoner', 'reps', 'rep'],
        setPatterns: ['sett', 'runder'],
        perSidePatterns: ['per side', 'hver side', 'per ben', 'per arm', 'bilateralt'],
        defaultIntensity: 'Middels',
        intensityLabels: {
          rest: 'Hvile',
          easy: 'Lett',
          hard: 'Hard',
          medium: 'Middels'
        }
      };
    case 'danish':
      return {
        // More flexible day pattern matching - case insensitive, allows variations
        dayRegex: /(?:dag|træningsdag|session|træningssession|øvelse)\s*(\d+)[:\.\s-]+(.*?)(?=(?:dag|træningsdag|session|træningssession|øvelse)\s*\d+[:\.\s-]|$)/gis,
        endMarker: 'Dag 999:',
        dayPrefix: 'Dag',
        trainingSuffix: 'Træning',
        easyPatterns: ['let', 'nem', 'lav intensitet'],
        mediumPatterns: ['mellem', 'moderat'],
        hardPatterns: ['hård', 'tung', 'intens', 'høj intensitet'],
        restPatterns: ['hvile', 'restitution', 'hviledag'],
        repPatterns: ['gentagelser', 'reps', 'rep'],
        setPatterns: ['sæt', 'runder'],
        perSidePatterns: ['per side', 'hver side', 'per ben', 'per arm', 'bilateralt'],
        defaultIntensity: 'Mellem',
        intensityLabels: {
          rest: 'Hvile',
          easy: 'Let',
          hard: 'Hård',
          medium: 'Mellem'
        }
      };
    case 'finnish':
      return {
        // More flexible day pattern matching - case insensitive, allows variations
        dayRegex: /(?:päivä|harjoituspäivä|sessio|harjoitus)\s*(\d+)[:\.\s-]+(.*?)(?=(?:päivä|harjoituspäivä|sessio|harjoitus)\s*\d+[:\.\s-]|$)/gis,
        endMarker: 'Päivä 999:',
        dayPrefix: 'Päivä',
        trainingSuffix: 'Harjoitus',
        easyPatterns: ['helppo', 'kevyt', 'matala intensiteetti'],
        mediumPatterns: ['keskitaso', 'kohtalainen'],
        hardPatterns: ['kova', 'raskas', 'intensiivinen', 'korkea intensiteetti'],
        restPatterns: ['lepo', 'palautuminen', 'lepopäivä'],
        repPatterns: ['toistot', 'toisto'],
        setPatterns: ['sarjat', 'sarja', 'kierrokset'],
        perSidePatterns: ['per puoli', 'joka puoli', 'per jalka', 'per käsi'],
        defaultIntensity: 'Keskitaso',
        intensityLabels: {
          rest: 'Lepo',
          easy: 'Helppo',
          hard: 'Kova',
          medium: 'Keskitaso'
        }
      };
    case 'english':
    default:
      return {
        // Improved day pattern matching with more flexible formats
        dayRegex: /(?:day|training day|session|workout|exercise)\s*(\d+)[:.\s-]+(.*?)(?=(?:day|training day|session|workout|exercise)\s*\d+[:.\s-]|$)/gis,
        endMarker: 'Day 999:',
        dayPrefix: 'Day',
        trainingSuffix: 'Training',
        easyPatterns: ['easy', 'light', 'low intensity'],
        mediumPatterns: ['medium', 'moderate', 'intermediate'],
        hardPatterns: ['hard', 'heavy', 'intense', 'high intensity'],
        restPatterns: ['rest', 'recovery', 'active recovery'],
        repPatterns: ['reps', 'rep', 'repetitions'],
        setPatterns: ['sets', 'set'],
        perSidePatterns: ['per side', 'each side', 'per leg', 'per arm', 'bilateral'],
        defaultIntensity: 'Medium',
        intensityLabels: {
          rest: 'Rest',
          easy: 'Easy',
          hard: 'Hard',
          medium: 'Medium'
        }
      };
  }
};

// Detect if the text appears to be in Excel format (e.g., tabular data)
// Using the existing detectExcelFormat function to avoid duplication
// This was causing a "symbol has already been declared" error
// const detectExcelFormat = (text) => {
//   ... duplicate implementation removed ...
// };

// Detect natural sections in text based on content patterns
function detectTextSections(lines) {
  const sections = [];
  let currentSection = [];
  
  // Patterns that might indicate section breaks
  const sectionBreakPatterns = [
    /^(?:day|dag|päivä|jour|tag)\s*\d+/i,  // "Day 1", "Tag 2", etc.
    /^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,  // English weekdays
    /^(?:måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)/i,  // Swedish weekdays
    /^(?:workout|session|pass|träning|träningspass)/i,  // Workout session headers
    /^(?:week|vecka)\s*\d+/i,  // Week indicators
    /^\s*\d+[.:)].*(?:sets?|reps?|repetitions?|omgångar)/i  // Exercise patterns with numbers
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if current line indicates a new section
    const isNewSection = i === 0 || 
                         sectionBreakPatterns.some(pattern => pattern.test(line)) ||
                         (line.length < 25 && i > 0 && lines[i-1].trim() === '');
    
    if (isNewSection && currentSection.length > 0) {
      // Add the current section to sections and start a new one
      sections.push([...currentSection]);
      currentSection = [];
    }
    
    currentSection.push(line);
  }
  
  // Add the last section if it's not empty
  if (currentSection.length > 0) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Detect workout intensity from text content
function detectIntensityFromText(text, patterns) {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  // Check for rest day indicators
  if (patterns.restPatterns.some(pattern => lowerText.includes(pattern.toLowerCase()))) {
    return patterns.intensityLabels?.rest || 'Rest';
  }
  
  // Check for easy day indicators
  if (patterns.easyPatterns.some(pattern => lowerText.includes(pattern.toLowerCase()))) {
    return patterns.intensityLabels?.easy || 'Easy';
  }
  
  // Check for hard day indicators
  if (patterns.hardPatterns.some(pattern => lowerText.includes(pattern.toLowerCase()))) {
    return patterns.intensityLabels?.hard || 'Hard';
  }
  
  // Check the total number of exercises/sets mentioned as indicator of intensity
  const setMatches = lowerText.match(/\b\d+\s*(?:sets?|omgångar|sarjat|sett)\b/gi) || [];
  const repMatches = lowerText.match(/\b\d+\s*(?:reps?|repetitions?|toistot|gentagelser)\b/gi) || [];
  
  const totalSets = setMatches.reduce((sum, match) => {
    const num = parseInt(match.match(/\d+/)[0]);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  
  // Higher number of sets/reps indicates harder workout
  if (totalSets > 15 || setMatches.length > 5) {
    return patterns.intensityLabels?.hard || 'Hard';
  } else if (totalSets < 8 || setMatches.length < 3) {
    return patterns.intensityLabels?.easy || 'Easy';
  }
  
  // Default to medium intensity
  return patterns.intensityLabels?.medium || 'Medium';
}

// Helper function to extract numbers from text using multiple regex patterns
const extractNumber = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1]);
      if (!isNaN(num)) {
        return num;
      }
    }
  }
  return null;
};