import React, { useState } from 'react';
import { Mail, Briefcase, Users, LogIn, BookOpen, Building2, Calendar, FileText, Phone } from 'lucide-react'; // Added Phone icon

// Simulated Brand Colors
const COLORS = {
  primaryBlue: '#0F4C81',    // Institutional
  growthGreen: '#38761D',    // Success/Progress
  accentOrange: '#FF8C00',   // Primary CTA/Innovation
  neutralBg: '#F5F5F5',
  lightGray: '#EFEFEF',
};

const INITIAL_FORM_STATE = {
  founderName: '',
  email: '',
  phone: '', 
  ventureName: '',
  industry: 'Technology',
  pitchDeck: null,
  businessPlan: null,
  gdprConsent: false,
};

// --- ApplicationForm Component (Core Logic) ---
const ApplicationForm = ({ goToHome }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 4;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.files[0],
    }));
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateStep = (currentStep) => {
    let errors = {};
    if (currentStep === 1) {
      if (!formData.founderName.trim()) errors.founderName = 'Full Name is required.';
      if (!formData.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) errors.email = 'Valid email is required.';
      if (formData.phone && !formData.phone.match(/^\d{7,}$/)) errors.phone = 'Please enter a valid phone number (digits only, min 7).';
    } else if (currentStep === 2) {
      if (!formData.ventureName.trim()) errors.ventureName = 'Venture Name is required.';
    } else if (currentStep === 3) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!formData.pitchDeck) errors.pitchDeck = 'Pitch Deck upload is required.';
      else if (!formData.pitchDeck.type || !allowedTypes.includes(formData.pitchDeck.type) || formData.pitchDeck.size > 5 * 1024 * 1024) {
        errors.pitchDeck = 'File must be PDF/DOCX and under 5MB.';
      }
    } else if (currentStep === 4) {
      if (!formData.gdprConsent) errors.gdprConsent = 'GDPR consent is required for submission.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) { setStep(prev => prev < totalSteps ? prev + 1 : prev); } };
  const handleBack = () => { setStep(prev => prev > 1 ? prev - 1 : prev); setFormErrors({}); };
  
  // CORE SAVING FUNCTION (Client-to-Server)
  const submitFormData = async (data) => {
    const apiData = new FormData();
    for (const key in data) {
      if (key !== 'pitchDeck' && key !== 'businessPlan') {
        apiData.append(key, data[key]);
      }
    }
    if (data.pitchDeck) { apiData.append('pitchDeck', data.pitchDeck); }
    if (data.businessPlan) { apiData.append('businessPlan', data.businessPlan); }

    const apiUrl = '/api/application-submission'; 

    try {
        const response = await fetch(apiUrl, { method: 'POST', body: apiData });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown server error.' }));
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Submission failed during API call:', error);
        throw new Error('Could not connect to the server or file upload failed.');
    }
  }

  // Final Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(totalSteps)) return;
    setIsSubmitting(true);
    try {
        await submitFormData(formData);
        setStep(totalSteps + 1); 
    } catch (error) {
        console.error('Submission failed:', error.message);
        alert(`Application failed to submit. Error: ${error.message}`); 
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Rendering Steps ---
  const renderStep = () => {
    const commonInputClasses = (name) => 
        `w-full p-3 border rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all ${formErrors[name] ? 'border-red-500 ring-red-100' : 'border-gray-300 focus:ring-blue-500'}`;

    switch (step) {
      case 1:
        return (
          <fieldset>
            <legend className="text-2xl font-bold mb-6 border-b pb-2" style={{ color: COLORS.primaryBlue }}>1. Founder & Contact Details</legend>
            <div className="mb-6">
              <label htmlFor="founderName" className="block font-semibold mb-2">Full Name *</label>
              <input type="text" id="founderName" name="founderName" value={formData.founderName} onChange={handleChange} required className={commonInputClasses('founderName')} />
              {formErrors.founderName && <p className="text-red-500 text-sm mt-1">{formErrors.founderName}</p>}
            </div>
            <div className="mb-6">
              <label htmlFor="email" className="block font-semibold mb-2">Email *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={commonInputClasses('email')} />
              {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
            </div>
            <div className="mb-6">
              <label htmlFor="phone" className="block font-semibold mb-2">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={commonInputClasses('phone')} />
              {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={handleNext} className="px-8 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]" style={{ backgroundColor: COLORS.accentOrange }}>Next &rarr;</button>
            </div>
          </fieldset>
        );
      case 2:
        return (
          <fieldset>
            <legend className="text-2xl font-bold mb-6 border-b pb-2" style={{ color: COLORS.primaryBlue }}>2. Startup Details</legend>
            <div className="mb-6">
              <label htmlFor="ventureName" className="block font-semibold mb-2">Venture Name *</label>
              <input type="text" id="ventureName" name="ventureName" value={formData.ventureName} onChange={handleChange} required className={commonInputClasses('ventureName')} />
              {formErrors.ventureName && <p className="text-red-500 text-sm mt-1">{formErrors.ventureName}</p>}
            </div>
            <div className="mb-6">
              <label htmlFor="industry" className="block font-semibold mb-2">Industry</label>
              <select id="industry" name="industry" value={formData.industry} onChange={handleChange} className={commonInputClasses('industry')}>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Fintech">Fintech</option>
                <option value="Energy">Energy/CleanTech</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex justify-between mt-8">
              <button type="button" onClick={handleBack} className="bg-gray-400 text-white px-6 py-3 rounded-xl transition-colors hover:bg-gray-500">&larr; Back</button>
              <button type="button" onClick={handleNext} className="px-8 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]" style={{ backgroundColor: COLORS.accentOrange }}>Next &rarr;</button>
            </div>
          </fieldset>
        );
      case 3:
        return (
          <fieldset>
            <legend className="text-2xl font-bold mb-6 border-b pb-2" style={{ color: COLORS.primaryBlue }}>3. Document Upload</legend>
            <p className="mb-4 text-sm text-gray-600">Max file size: 5MB per file. Only PDF/DOCX accepted.</p>
            <div className="mb-6">
              <label htmlFor="pitchDeck" className="block font-semibold mb-2">Pitch Deck *</label>
              <input type="file" id="pitchDeck" name="pitchDeck" accept=".pdf,.doc,.docx" onChange={handleFileChange} required className={commonInputClasses('pitchDeck')} />
              {formErrors.pitchDeck && <p className="text-red-500 text-sm mt-1">{formErrors.pitchDeck}</p>}
            </div>
             <div className="mb-6">
              <label htmlFor="businessPlan" className="block font-semibold mb-2">Business Plan (Optional)</label>
              <input type="file" id="businessPlan" name="businessPlan" accept=".pdf,.doc,.docx" onChange={handleFileChange} className={commonInputClasses('businessPlan')} />
            </div>
            <div className="flex justify-between mt-8">
              <button type="button" onClick={handleBack} className="bg-gray-400 text-white px-6 py-3 rounded-xl transition-colors hover:bg-gray-500">&larr; Back</button>
              <button type="button" onClick={handleNext} className="px-8 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]" style={{ backgroundColor: COLORS.accentOrange }}>Next &rarr;</button>
            </div>
          </fieldset>
        );
      case 4:
        return (
          <fieldset>
            <legend className="text-2xl font-bold mb-6 border-b pb-2" style={{ color: COLORS.primaryBlue }}>4. Final Review & Consent</legend>
            <p className="mb-4 text-gray-700">Please review your details and confirm your consent below.</p>
            <div className="mb-6 flex items-start p-4 rounded-lg" style={{backgroundColor: COLORS.neutralBg, border: '1px solid #ddd'}}>
              <input type="checkbox" id="gdprConsent" name="gdprConsent" checked={formData.gdprConsent} onChange={handleChange}
                className="mt-1 mr-3 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded" style={{color: COLORS.growthGreen}} />
              <label htmlFor="gdprConsent" className="text-sm font-medium text-gray-700">
                I consent to the storage and processing of my data in accordance with the Incubation Service's Privacy Policy (GDPR Compliant) and confirm all submitted information is accurate. *
              </label>
            </div>
            {formErrors.gdprConsent && <p className="text-red-500 text-sm mb-4">{formErrors.gdprConsent}</p>}

            <div className="flex justify-between mt-8">
              <button type="button" onClick={handleBack} className="bg-gray-400 text-white px-6 py-3 rounded-xl transition-colors hover:bg-gray-500">&larr; Back</button>
              <button type="submit" onClick={handleSubmit} disabled={isSubmitting} 
                className="px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50" 
                style={{ backgroundColor: COLORS.growthGreen }}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </fieldset>
        );
      default:
        // Success/Confirmation Screen
        return (
          <div className="text-center p-12 rounded-xl shadow-inner" style={{ backgroundColor: COLORS.neutralBg }}>
            <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.growthGreen }}>🎉 Application Submitted Successfully!</h2>
            <p className="mt-4 text-gray-700 max-w-lg mx-auto">
                Thank you for applying. We have received your submission. A confirmation email with your unique tracking ID will be sent shortly.
            </p>
            <button onClick={goToHome} 
               className="inline-block mt-8 px-8 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]" 
               style={{ backgroundColor: COLORS.accentOrange }}>Return to Homepage</button>
          </div>
        );
    }
  };

  const progress = (step / totalSteps) * 100;
  const showProgress = step <= totalSteps;

  return (
    <div className="min-h-screen p-4 sm:p-8 flex items-start justify-center" style={{ backgroundColor: COLORS.neutralBg }}>
      <div className="max-w-4xl w-full mx-auto p-6 sm:p-10 rounded-xl shadow-2xl my-10" style={{ backgroundColor: 'white' }}>
        <h1 className="text-3xl text-center mb-8 font-extrabold tracking-tight" style={{ color: COLORS.primaryBlue }}>Incubation Program Application</h1>
        
        {showProgress && (
          <div className="progress-bar-container mb-8">
            <p className="text-base font-semibold mb-2" style={{ color: COLORS.primaryBlue }}>Step {step} of {totalSteps}</p>
            <div className="progress-indicator h-2.5 rounded-full bg-gray-200">
              <div id="progress-fill" className="progress-fill h-full rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progress}%`, backgroundColor: COLORS.growthGreen }}></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStep()}
        </form>
      </div>
    </div>
  );
};


// --- Placeholder Components for New Pages (Features 1, 2, 3, 5, 9) ---

const PageWrapper = ({ title, children, ctaLink, ctaText }) => (
    <div className="min-h-[70vh] py-16 px-4 sm:px-8" style={{ backgroundColor: COLORS.neutralBg }}>
        <div className="max-w-6xl mx-auto p-8 sm:p-12 rounded-xl shadow-2xl" style={{ backgroundColor: 'white' }}>
            <h2 className="text-4xl font-extrabold mb-4 border-b pb-4" style={{ color: COLORS.primaryBlue }}>{title}</h2>
            {children}
            {ctaLink && (
                <div className="mt-10 text-center">
                     <button onClick={ctaLink} 
                        className="px-10 py-4 rounded-full text-white font-bold shadow-lg transition-transform hover:scale-[1.05]"
                        style={{ backgroundColor: COLORS.accentOrange }}>
                        {ctaText}
                    </button>
                </div>
            )}
        </div>
    </div>
);

const HomePageContent = ({ setPage }) => (
    <div className="min-h-[80vh] flex flex-col pt-16" style={{ backgroundColor: COLORS.neutralBg }}>
        {/* Hero Section (Feature 1: CTA, Highlights) */}
        <div className="bg-cover py-20 text-center shadow-inner" style={{ backgroundColor: COLORS.primaryBlue, color: 'white' }}>
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-5xl font-extrabold mb-4">Launch Your Future with INCUBATOR PRO</h1>
                <p className="text-xl mb-8 opacity-90">Providing capital, mentorship, and resources for the next generation of industry leaders.</p>
                <button 
                    onClick={() => setPage('application')}
                    className="px-10 py-4 rounded-full text-lg font-bold shadow-xl transition-transform hover:scale-[1.05] animate-pulse"
                    style={{ backgroundColor: COLORS.accentOrange, color: COLORS.primaryBlue }}>
                    Apply to the Program Today!
                </button>
            </div>
        </div>

        {/* Key Services Highlights (Feature 1) */}
        <div className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
                <div className="p-6 rounded-xl shadow-md border-t-4" style={{ borderColor: COLORS.accentOrange }}>
                    <Briefcase size={36} className="mx-auto mb-3" style={{ color: COLORS.primaryBlue }} />
                    <h3 className="text-xl font-bold mb-2">Dedicated Mentorship</h3>
                    <p className="text-gray-600">Access our network of 50+ industry experts and seasoned investors.</p>
                </div>
                <div className="p-6 rounded-xl shadow-md border-t-4" style={{ borderColor: COLORS.growthGreen }}>
                    <Building2 size={36} className="mx-auto mb-3" style={{ color: COLORS.primaryBlue }}/>
                    <h3 className="text-xl font-bold mb-2">Funding Opportunities</h3>
                    <p className="text-gray-600">Secure seed and growth capital tailored to your venture's stage.</p>
                </div>
                <div className="p-6 rounded-xl shadow-md border-t-4" style={{ borderColor: COLORS.primaryBlue }}>
                    <BookOpen size={36} className="mx-auto mb-3" style={{ color: COLORS.primaryBlue }}/>
                    <h3 className="text-xl font-bold mb-2">Resource Library</h3>
                    <p className="text-gray-600">Download templates, guides, and operating procedure checklists.</p>
                </div>
            </div>
        </div>

        {/* Blog & News Preview (Feature 8) */}
        <div className="py-16" style={{ backgroundColor: COLORS.lightGray }}>
            <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-3xl font-extrabold mb-8 text-center" style={{ color: COLORS.primaryBlue }}>Latest Insights & Success Stories</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {['Alumni Spotlight: Q3 Success', 'Industry Trend: AI in Healthcare', 'How to Nail Your Pitch Deck'].map((item, index) => (
                        <div key={index} className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                            <p className="text-sm font-semibold mb-1" style={{ color: COLORS.growthGreen }}>{index === 0 ? 'Success Story' : 'Industry News'}</p>
                            <h4 className="text-lg font-bold text-gray-800">{item}</h4>
                            <p className="text-sm text-gray-500 mt-2">Read More &rarr;</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const AboutUsPage = ({ setPage }) => (
    <PageWrapper title="About INCUBATOR PRO">
        <div className="grid md:grid-cols-2 gap-10 text-gray-700">
            <div>
                <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.accentOrange }}>Our Mission & Vision (Feature 2)</h3>
                <p className="mb-4">Our mission is to empower early-stage ventures with the capital, connectivity, and expertise required to transition from a promising concept to a scalable business reality. We envision a future where innovation knows no barriers.</p>
                <p>We are committed to **diversity and impact**, focusing on companies that solve meaningful problems in technology, healthcare, and clean energy.</p>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.accentOrange }}>Our Team & Culture (Feature 2)</h3>
                <p className="mb-4">INCUBATOR PRO is led by a dedicated team of entrepreneurs, venture capitalists, and academic experts. Our flat, collaborative structure ensures fast decision-making and hands-on support for our founders.</p>
                <ul className="list-disc list-inside space-y-1">
                    <li><span className="font-semibold" style={{ color: COLORS.primaryBlue }}>Jane Doe:</span> Director, Strategic Partnerships</li>
                    <li><span className="font-semibold" style={{ color: COLORS.primaryBlue }}>John Smith:</span> Head of Technology Incubation</li>
                </ul>
            </div>
        </div>
        <div className="pt-8">
            <h3 className="text-xl font-bold mb-3 border-t pt-4 mt-4" style={{ color: COLORS.accentOrange }}>Partnerships & Linkages (Feature 2)</h3>
            <p className="text-gray-600">We maintain strong ties with major university research departments, governmental funding agencies, and leading corporate partners to maximize your access to resources and market opportunities.</p>
        </div>
    </PageWrapper>
);

const ServicesPage = ({ setPage }) => (
    <PageWrapper title="Incubation Services & Support">
        <div className="space-y-8 text-gray-700">
            {/* Pre-Incubation (Feature 3) */}
            <div className="p-6 rounded-lg shadow-md" style={{ borderLeft: `5px solid ${COLORS.primaryBlue}`, backgroundColor: COLORS.lightGray }}>
                <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.primaryBlue }}>Pre-Incubation (Concept Validation)</h3>
                <p className="mb-4">This 3-month phase focuses on refining your concept, validating market fit, and building a minimum viable product (MVP). Includes:</p>
                <ul className="list-disc list-inside ml-4 grid md:grid-cols-2">
                    <li>Idea Stress Testing Workshops</li>
                    <li>Financial Modeling Templates</li>
                    <li>Legal Structuring Basics</li>
                </ul>
            </div>
            
            {/* Incubation Resources (Feature 3) */}
            <div className="p-6 rounded-lg shadow-md" style={{ borderLeft: `5px solid ${COLORS.growthGreen}`, backgroundColor: COLORS.lightGray }}>
                <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.growthGreen }}>Core Incubation (Growth & Scaling)</h3>
                <p className="mb-4">Our main 12-month program provides hands-on support for scaling your team, acquiring early customers, and preparing for external funding rounds. Includes:</p>
                <ul className="list-disc list-inside ml-4 grid md:grid-cols-2">
                    <li>Dedicated Lead Mentor (Feature 6: Mentor Network)</li>
                    <li>Access to Seed Capital Fund</li>
                    <li>Co-Working Space & Infrastructure</li>
                    <li>Bi-weekly Investor Pitch Sessions (Feature 6: Investor Network)</li>
                </ul>
            </div>

             {/* Post-Incubation (Feature 3) */}
            <div className="p-6 rounded-lg shadow-md" style={{ borderLeft: `5px solid ${COLORS.accentOrange}`, backgroundColor: COLORS.lightGray }}>
                <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.accentOrange }}>Post-Incubation (Alumni Support)</h3>
                <p className="mb-4">We continue to support our alumni with networking events and follow-on funding advice.</p>
                <p className="font-semibold">Alumni Success Stories Showcase (Feature 3)</p>
                <p>See our past ventures that have raised over $100M collectively in follow-on funding.</p>
            </div>
        </div>
    </PageWrapper>
);

const ResourceLibraryPage = ({ setPage }) => (
    <PageWrapper title="Resource Library & FAQs (Feature 5)">
        <p className="text-lg text-gray-600 mb-8">Access all necessary documents, training materials, and frequently asked questions for your venture.</p>

        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.primaryBlue }}>Downloadable Forms & Checklists</h3>
        <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center p-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.lightGray }}>
                <span className="flex items-center font-medium"><FileText size={20} className="mr-3" style={{ color: COLORS.primaryBlue }}/> Business Plan Template (DOCX)</span>
                <a href="#" className="text-sm font-semibold" style={{ color: COLORS.growthGreen }}>Download &rarr;</a>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.lightGray }}>
                <span className="flex items-center font-medium"><FileText size={20} className="mr-3" style={{ color: COLORS.primaryBlue }}/> Application Checklist (PDF)</span>
                <a href="#" className="text-sm font-semibold" style={{ color: COLORS.growthGreen }}>Download &rarr;</a>
            </div>
             <div className="flex justify-between items-center p-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.lightGray }}>
                <span className="flex items-center font-medium"><FileText size={20} className="mr-3" style={{ color: COLORS.primaryBlue }}/> Operating Procedures Guide (PDF)</span>
                <a href="#" className="text-sm font-semibold" style={{ color: COLORS.growthGreen }}>Download &rarr;</a>
            </div>
        </div>
        
        <h3 className="text-2xl font-bold mb-4 border-t pt-6" style={{ color: COLORS.primaryBlue }}>FAQs & Training</h3>
        <p className="text-gray-700">A dedicated video training portal and FAQ section are available in the member-only area (Login feature).</p>

    </PageWrapper>
);

const ContactUsPage = ({ setPage }) => (
    <PageWrapper title="Contact Us (Feature 9)">
        <div className="grid md:grid-cols-2 gap-10">
            <div>
                <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.accentOrange }}>Get in Touch</h3>
                <p className="text-gray-700 mb-6">Have questions about the program or your existing application? Reach out to our team.</p>
                
                <div className="space-y-4">
                    <div className="flex items-center">
                        <Mail size={20} className="mr-3" style={{ color: COLORS.primaryBlue }}/>
                        <span>**Email:** <span className="font-semibold">pice.incubation@gmail.com</span></span> {/* Updated Email */}
                    </div>
                     <div className="flex items-center">
                        <Phone size={20} className="mr-3" style={{ color: COLORS.primaryBlue }}/>
                        <span>**Phone:** <span className="font-semibold">+251-115-517-839</span></span> {/* Added Phone */}
                    </div>
                    <div className="flex items-center">
                        <Building2 size={20} className="mr-3" style={{ color: COLORS.primaryBlue }}/>
                        <span>**Address:** Bole Road, Block B, Floor 5, Addis Ababa, Ethiopia</span> {/* Contextual Address */}
                    </div>
                    <div className="flex items-center">
                        <Calendar size={20} className="mr-3" style={{ color: COLORS.primaryBlue }}/>
                        <span>**Operating Hours:** Mon-Fri, 9:00 AM - 5:00 PM (EAT)</span> {/* Updated Timezone */}
                    </div>
                </div>

                <div className="mt-8 p-4 rounded-lg border" style={{ borderColor: COLORS.lightGray }}>
                    <h4 className="font-bold mb-2">Technical Note (Feature 9: Map)</h4>
                    <p className="text-sm text-gray-600">A map integration is pending backend deployment. Please use the address provided above.</p>
                </div>
            </div>
            
            {/* Contact Form Placeholder (Feature 9) */}
            <div className="p-6 rounded-xl shadow-lg" style={{ backgroundColor: COLORS.lightGray }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.primaryBlue }}>Send us a Message</h3>
                <input type="text" placeholder="Your Name" className="w-full p-3 mb-4 rounded-lg border border-gray-300" />
                <input type="email" placeholder="Your Email" className="w-full p-3 mb-4 rounded-lg border border-gray-300" />
                <textarea placeholder="Your Message" rows="4" className="w-full p-3 mb-4 rounded-lg border border-gray-300"></textarea>
                <button 
                    className="w-full py-3 rounded-lg text-white font-bold transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: COLORS.accentOrange }}>
                    Submit Query
                </button>
            </div>
        </div>
    </PageWrapper>
);

// --- Main App Component (The Wrapper/Router) ---
const App = () => {
    // Expanded state for multi-page site
    const [page, setPage] = useState('home'); // 'home', 'about', 'services', 'resources', 'contact', 'application'

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <HomePageContent setPage={setPage} />;
            case 'about':
                return <AboutUsPage setPage={setPage} />;
            case 'services':
                return <ServicesPage setPage={setPage} />;
            case 'resources':
                return <ResourceLibraryPage setPage={setPage} />;
            case 'contact':
                return <ContactUsPage setPage={setPage} />;
            case 'application':
                // Renders the Application Form
                return <ApplicationForm goToHome={() => setPage('home')} />;
            default:
                return <HomePageContent setPage={setPage} />;
        }
    }

    const navItemClass = (targetPage) => 
        `px-3 py-2 rounded-lg font-medium transition-colors flex items-center ${
            page === targetPage ? 'text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`;
    
    // Custom button for the "Apply" CTA
    const applyButtonClass = `px-4 py-2 rounded-lg text-white font-bold shadow-md transition-transform hover:scale-105`;


    return (
        <div style={{ fontFamily: 'Inter, sans-serif' }} className="pt-16">
            {/* Header (The Navigation Menu - Feature 1) */}
            <header className="fixed top-0 left-0 right-0 z-50 shadow-lg" style={{ backgroundColor: 'white' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="logo cursor-pointer" onClick={() => setPage('home')} title="Home">
                        <span className="text-2xl font-extrabold" style={{ color: COLORS.primaryBlue }}>INCUBATOR <span style={{ color: COLORS.growthGreen }}>PRO</span></span>
                    </div>
                    <nav className="flex space-x-2 sm:space-x-4 items-center overflow-x-auto whitespace-nowrap">
                        <button onClick={() => setPage('home')} className={navItemClass('home')}>Home</button>
                        <button onClick={() => setPage('about')} className={navItemClass('about')}>About Us</button>
                        <button onClick={() => setPage('services')} className={navItemClass('services')}>Services</button>
                        <button onClick={() => setPage('resources')} className={navItemClass('resources')}>Resources</button>
                        <button onClick={() => setPage('contact')} className={navItemClass('contact')}>Contact</button>
                        
                        {/* Apply CTA (Feature 4: Application Portal) */}
                        <button onClick={() => setPage('application')} className={applyButtonClass} style={{ backgroundColor: COLORS.accentOrange }}>
                            <Users size={18} className="inline mr-1"/> Apply
                        </button>
                        
                        {/* Login/Member Area (Feature 6, 7, partial 5) */}
                         <button className={navItemClass('login')}>
                            <LogIn size={18} className="mr-1" style={{ color: COLORS.primaryBlue }}/> Login
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main>
                {renderPage()}
            </main>

            {/* Footer */}
            <footer className="py-8" style={{ backgroundColor: COLORS.primaryBlue, color: COLORS.neutralBg }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="font-semibold" style={{ color: COLORS.accentOrange }}>Quick Links</div>
                        <div className="font-semibold" style={{ color: COLORS.accentOrange }}>Legal</div>
                        <div className="font-semibold" style={{ color: COLORS.accentOrange }}>Connect</div>
                        <div className="font-semibold" style={{ color: COLORS.accentOrange }}>Contact</div>
                        
                        <button onClick={() => setPage('services')} className="text-xs text-left hover:text-white transition-colors">Incubation Program</button>
                        <a href="#" className="text-xs text-left hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="text-xs text-left hover:text-white transition-colors">Mentor Network</a>
                         <button onClick={() => setPage('contact')} className="text-xs text-left hover:text-white transition-colors">Email Us</button>

                        <button onClick={() => setPage('resources')} className="text-xs text-left hover:text-white transition-colors">Resource Library</button>
                        <a href="#" className="text-xs text-left hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="text-xs text-left hover:text-white transition-colors">Events Calendar</a>
                        <button onClick={() => setPage('application')} className="text-xs text-left hover:text-white transition-colors">Apply Now</button>
                    </div>

                    <div className="border-t pt-4 mt-4 text-center">
                        <p className="text-sm mb-2">&copy; 2025 Incubation Service. All Rights Reserved.</p>
                        <p className="text-xs">Built with <span className="font-bold" style={{color: COLORS.accentOrange}}>Innovation</span> and <span className="font-bold" style={{color: COLORS.growthGreen}}>Growth</span>.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
