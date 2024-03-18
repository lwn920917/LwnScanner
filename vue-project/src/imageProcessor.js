// imageProcessor.js
import axios from 'axios';

// Mathpix API credentials - Replace with your own credentials

async function callMathpixTextAPI(base64) {
    try {
      return await axios.post('https://api.mathpix.com/v3/text', {
        src: `data:image/png;base64,${base64}`,
        formats: ['text'],
        enable_tables_fallback: true,
      }, {
        headers: {
          'app_id': MATHPIX_APP_ID,
          'app_key': MATHPIX_APP_KEY,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.log('Error in calling Mathpix Text API:', error);
      return { error: `Error in calling Mathpix Text API: ${error.message}` };
    }
  }
  
  // Function to convert extracted text to Markdown
  async function convertTextToMarkdown(text) {
    try {
      const conversionResponse = await axios.post('https://api.mathpix.com/v3/converter', {
        mmd: text,
        formats: { md: true },
      }, {
        headers: {
          'app_id': MATHPIX_APP_ID,
          'app_key': MATHPIX_APP_KEY,
          'Content-Type': 'application/json',
        },
      });
  
      const { conversion_id } = conversionResponse.data;
      await waitForConversionToComplete(conversion_id);
  
      const downloadResponse = await axios.get(`https://api.mathpix.com/v3/converter/${conversion_id}.md`, {
        headers: {
          'app_id': MATHPIX_APP_ID,
          'app_key': MATHPIX_APP_KEY,
        },
      });
  
      return downloadResponse.data;
    } catch (error) {
      console.log('Error in converting text to Markdown:', error);
      return { error: `Error in converting text to Markdown: ${error.message}` };
    }
  }
  
  // Function to wait for the conversion to be completed
  async function waitForConversionToComplete(conversion_id) {
    let conversionStatus = '';
    const startTime = Date.now();
    const timeoutLimit = 30000; // 30 seconds timeout
  
    try {
      while (conversionStatus !== 'completed') {
        if (Date.now() - startTime > timeoutLimit) {
          throw new Error('Conversion timed out');
        }
  
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
  
        const statusResponse = await axios.get(`https://api.mathpix.com/v3/converter/${conversion_id}`, {
          headers: {
            'app_id': MATHPIX_APP_ID,
            'app_key': MATHPIX_APP_KEY,
          },
        });
  
        conversionStatus = statusResponse.data.status;
      }
    } catch (error) {
      console.log('Error in waiting for conversion to complete:', error);
      return { error: `Error in waiting for conversion to complete: ${error.message}` };
    }
  }
  
  // Main function to process image to Markdown
  export async function processImageToMarkdown(base64) {
    try {
      const textResponse = await callMathpixTextAPI(base64);
      if (textResponse.error) {
        return textResponse; // Return error if call to Mathpix Text API failed
      }
  
      const markdown = await convertTextToMarkdown(textResponse.data.text);
      if (markdown.error) {
        return markdown; // Return error if conversion to Markdown failed
      }
  
      return markdown;
    } catch (error) {
      console.log('Error in processing image to Markdown:', error);
      return { error: `Error in processing image to Markdown: ${error.message}` };
    }
  }
