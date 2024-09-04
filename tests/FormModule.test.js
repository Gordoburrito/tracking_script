import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FormModule, APIModule, TrackingModule } from '../script.js'

// IMPORTANT!!!!!!!!!!!!!! if adding a new form! double check it with this!
// run this in the console to get the form's data
// const form = document.querySelectorAll('form')[0]

// // to set up a new test case 
// function cleanLabelText (text) {
//         return text.replace(/[^a-zA-Z\s]/g, '')  // Remove non-alphabetic characters
//                    .replace(/\s+/g, ' ')         // Normalize white spaces
//                    .trim();                      // Trim leading/trailing spaces
// }
    
// function getFormDataArray(form) {
//         const formData = new FormData(form);
//         return Array.from(formData.entries()).map(([key, value]) => {
//             const field = form.querySelector(`[name="${key}"]`);
//             const label = form.querySelector(`label[for="${field.id}"]`);
//             let labelText = label ? label.textContent.trim() : key;
//             labelText = cleanLabelText(labelText);
//             return { key: labelText, value };
//         });
// }
    
// console.log(getFormDataArray(form))
// take the results and put them into the test cases 

describe('FormModule', () => {
  let mockForm;
  let originalFuse;

  beforeEach(() => {
    vi.resetAllMocks()
    document.createElement = vi.fn().mockReturnValue({ 
      setAttribute: vi.fn(),
      onload: null
    })
    document.head.appendChild = vi.fn()
    vi.spyOn(FormModule, 'setupFormHandling')
    vi.spyOn(APIModule, 'post').mockResolvedValue({})
    vi.spyOn(TrackingModule, 'handleEvent')
    vi.spyOn(TrackingModule, 'getTrackingData').mockReturnValue({ mockTracking: 'data' })

    // Mock form and its elements
    mockForm = {
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([]),
      querySelector: vi.fn().mockImplementation((selector) => {
        if (selector === '[name="name"]') return { id: 'name' }
        if (selector === '[name="email"]') return { id: 'email' }
        if (selector === 'label[for="name"]') return { textContent: 'Name:' }
        if (selector === 'label[for="email"]') return { textContent: 'Email:' }
        return null
      })
    }
    global.FormData = vi.fn().mockImplementation(() => ({
      entries: () => [
        ['name', 'John Doe'],
        ['email', 'john@example.com']
      ]
    }))
    // Store the original global Fuse mock
    originalFuse = global.Fuse;
    global.Fuse = vi.fn().mockImplementation(() => ({
      search: vi.fn().mockReturnValue([{ item: { value: 'mocked value' } }])
    }))
  })

  afterEach(() => {
    // Restore the original Fuse mock after each test
    global.Fuse = originalFuse;
  })

  it('should initialize correctly', () => {
    expect(FormModule).toBeDefined()
  })

  // delete this if it breaks
  it('should load FuseJS and set up form handling', () => {
    FormModule.init()
    
    expect(document.createElement).toHaveBeenCalledWith('script')
    expect(document.head.appendChild).toHaveBeenCalled()
    
    const scriptElement = document.createElement.mock.results[0].value
    scriptElement.onload()
    
    expect(FormModule.setupFormHandling).toHaveBeenCalled()
  })

  it('should handle form submission correctly', () => {
    const event = { preventDefault: vi.fn(), target: mockForm }
    FormModule.handleFormSubmit(event)
    
    expect(event.preventDefault).toHaveBeenCalled()
    expect(TrackingModule.handleEvent).toHaveBeenCalledWith('form_submission')
    expect(APIModule.post).toHaveBeenCalled()
  })

  function runFuseTestCase(testCase) {
    const { formFields, expected } = testCase;
    
    let mockForm = {
      querySelector: vi.fn().mockImplementation((selector) => {
        const field = formFields.find(f => selector === `[name="${f.name}"]` || selector === `label[for="${f.name}"]`);
        return field ? (selector.startsWith('label') ? { textContent: field.label } : { id: field.name }) : null;
      })
    };

    global.FormData = vi.fn().mockImplementation(() => ({
      entries: () => formFields.map(f => [f.name, f.value])
    }));

    global.Fuse = vi.fn().mockImplementation(() => ({
      search: vi.fn().mockImplementation((searchKey) => {
        const lowercaseKey = searchKey.toLowerCase();
        const matchedField = formFields.find(f => 
          f.name.toLowerCase().includes(lowercaseKey) || 
          f.label.toLowerCase().includes(lowercaseKey)
        );
        return matchedField ? [{ item: { value: matchedField.value } }] : [];
      })
    }));

    const formDataArray = FormModule.getFormDataArray(mockForm);
    const fuzzyMatcher = FormModule.createFuzzyMatcher(formDataArray);
    const leadData = FormModule.extractLeadData(fuzzyMatcher);

    expect(leadData).toEqual(expected);
  }

  describe('Fuzzy matching with Fuse', () => {
    const testCases = [
      {
        name: 'standard field names',
        formFields: [
          { name: 'name', label: 'Name:', value: 'John Doe' },
          { name: 'email', label: 'Email:', value: 'john@example.com' },
          { name: 'phone', label: 'Phone:', value: '1234567890' }
        ],
        expected: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        }
      },
      {
        name: 'varied field names',
        formFields: [
          { name: 'full_name', label: 'Full Name:', value: 'Jane Smith' },
          { name: 'email_address', label: 'Email Address:', value: 'jane@example.com' },
          { name: 'telephone', label: 'Telephone Number:', value: '9876543210' }
        ],
        expected: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '9876543210'
        }
      },
      {
        name: 'split name fields',
        formFields: [
          { name: 'first_name', label: 'First Name:', value: 'Alice' },
          { name: 'last_name', label: 'Last Name:', value: 'Johnson' },
          { name: 'contact_email', label: 'Contact Email:', value: 'alice@example.com' },
          { name: 'mobile', label: 'Mobile:', value: '5555555555' }
        ],
        expected: {
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@example.com',
          phone: '5555555555'
        }
      },
      {
        name: 'dental form with additional fields',
        formFields: [
          { name: 'full-name', label: 'Full Name:', value: 'Robert Brown' },
          { name: 'phone', label: 'Phone:', value: '1234567890' },
          { name: 'email', label: 'Email Address:', value: 'robert@example.com' },
          { name: 'newPatient', label: 'First Time Patient?', value: 'Yes' },
          { name: 'message', label: 'Message:', value: 'I need an appointment' },
          { name: 'agreeToTerms', label: 'I agree to receive marketing...', value: 'true' }
        ],
        expected: {
          first_name: 'Robert',
          last_name: 'Brown',
          email: 'robert@example.com',
          phone: '1234567890'
        }
      },
      {
        name: 'dental appointment request form',
        formFields: [
          { name: 'item_meta[21]', label: 'Name', value: 'John' },
          { name: 'item_meta[22]', label: 'Last', value: 'Doe' },
          { name: 'item_meta[31]', label: 'Email Address', value: 'john.doe@example.com' },
          { name: 'item_meta[24]', label: 'Phone Number', value: '1234567890' },
          { name: 'item_meta[25]', label: 'Preferred Office', value: 'Andalusia' },
          { name: 'item_meta[30]', label: 'Preferred Time', value: 'AM' },
          { name: 'item_meta[26]', label: 'Preferred Day', value: 'Monday' },
          { name: 'item_meta[27]', label: 'Subject', value: 'New Patient Appointment' },
          { name: 'item_meta[28]', label: 'Comments', value: 'I would like to schedule a consultation.' }
        ],
        expected: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890'
        }
      },
      {
        name: 'orthodontics contact form',
        formFields: [
          { name: 'your-name', label: 'Name', value: 'Jane Smith' },
          { name: 'your-first-name', label: 'Frmstate', value: 'WHAT' },
          { name: 'your-last-name', label: 'Last Name', value: 'Smith' },
          { name: 'your-tel', label: 'Phone', value: '1234567890' },
          { name: 'your-email', label: 'Email', value: 'jane.smith@example.com' },
          { name: 'your-message', label: 'Your message here...', value: 'I would like to schedule an appointment.' },
          { name: 'marketing-agreement[]', label: 'I agree to receive marketing...', value: 'checked' }
        ],
        expected: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          phone: '1234567890'
        }
      },
      {
        name: 'twortho form',
        formFields: [
          { name: 'frmaction', label: 'Form Action', value: 'create' },
          { name: 'formid', label: 'Form ID', value: '4' },
          { name: 'formkey', label: 'Form Key', value: 'contact222' },
          { name: 'Name', label: 'Name', value: 'Cora' },
          { name: 'Last', label: 'Last Name', value: 'Randall' },
          { name: 'Email Address', label: 'Email Address', value: 'tadi@mailinator.com' },
          { name: 'Phone Number', label: 'Phone Number', value: '17252238441' },
          { name: 'Preferred Office', label: 'Preferred Office', value: 'Andalusia' },
          { name: 'Preferred Time', label: 'Preferred Time', value: 'AM' },
          { name: 'Preferred Day', label: 'Preferred Day', value: 'Wednesday' },
          { name: 'Subject', label: 'Subject', value: 'Dolorem nemo dolore' },
          { name: 'Comments', label: 'Comments', value: 'Quos nostrum molliti' },
          { name: 'If you are human leave this field blank', label: 'Honeypot', value: 'vipamoqiho@mailinator.com' },
          { name: 'frmstate', label: 'Form State', value: 'Vf5mJbU0orpUfMnLJeHUw6IhS7p0Gb8C65r4NVGFsL8=' },
          { name: 'akjs', label: 'AKJS', value: '1725486859315' }
        ],
        expected: {
          first_name: 'Cora',
          last_name: 'Randall',
          email: 'tadi@mailinator.com',
          phone: '17252238441'
        }
      },
      {
        name: 'recaptcha odortho',
        formFields: [
          { name: 'yourtel', label: 'yourtel', value: '0987654321' },
          { name: 'wpcfrecaptcharesponse', label: 'wpcfrecaptcharesponse', value: '1234567890' },
        ],
        expected: {
          phone: '0987654321',
          first_name: '',
          last_name: '',
          email: null
        }
      },
    ];

    testCases.forEach(({ name, formFields, expected }) => {
      it(`should correctly process ${name}`, () => {
        runFuseTestCase({ formFields, expected });
      });
    });
  });
})

// IMPORTANT!!!!!!!!!!!!!!
// const form = document.querySelectorAll('form')[0]

// // to set up a new test case 
// function cleanLabelText (text) {
//         return text.replace(/[^a-zA-Z\s]/g, '')  // Remove non-alphabetic characters
//                    .replace(/\s+/g, ' ')         // Normalize white spaces
//                    .trim();                      // Trim leading/trailing spaces
// }
    
// function getFormDataArray(form) {
//         const formData = new FormData(form);
//         return Array.from(formData.entries()).map(([key, value]) => {
//             const field = form.querySelector(`[name="${key}"]`);
//             const label = form.querySelector(`label[for="${field.id}"]`);
//             let labelText = label ? label.textContent.trim() : key;
//             labelText = cleanLabelText(labelText);
//             return { key: labelText, value };
//         });
// }
    
// console.log(getFormDataArray(form))
// // take the results and put them into the test cases 
