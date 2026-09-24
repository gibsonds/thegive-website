# Mailing list launch setup

Status: the website no longer pretends to collect email addresses. Its “Stay close” section points to Instagram until a real, tested signup URL is configured in `site-config.js`.

## Decisions and access

1. Choose the mailing-list provider and one band member who owns the account. The August go-to-market draft named Mailchimp or Kit; neither is connected to this workspace yet. A provider-hosted signup page is the simplest fit for this static GitHub Pages site.
2. Use a band-controlled account, enable two-factor authentication, and keep access in the shared password manager. Do not put credentials or API keys in this repository.
3. Confirm the public sender name and reply-to address. Confirm a valid mailing address for campaign footers; a registered PO box is an option if the band does not want a home address there.
4. Create one audience for The Give. Start with email address only, enable double opt-in, and make unsubscribing available in every campaign. Do not bulk-import old contacts without a fresh permission path.

## Copy ready for the provider

Signup heading: **Hear what The Give is doing next**

Signup description: “Get occasional emails about new music and shows from The Give. No filler. Unsubscribe whenever you like.”

Confirmation prompt: “Check your inbox and confirm your address to join The Give’s email list.”

Welcome email subject: **You’re on The Give list**

Welcome email body:

> Thanks for joining us. We’ll send occasional notes about the songs, what’s happening in the room now, and the first show when the details are firm. In the meantime, you can hear the studio recordings and watch the band’s interview at https://gibsonds.github.io/thegive-website/ .
>
> The Give

Add the provider’s unsubscribe link and the band’s confirmed mailing address through its standard campaign footer.

Privacy copy to adapt after the provider is chosen: “The Give uses [provider] to collect your email address and send occasional updates about music and shows. We use your address only for these updates and do not sell it. You can unsubscribe from any email. Questions: thegivebandct@gmail.com.” Check the provider’s actual data handling and fill in its name before publishing this copy.

## Connect the website

1. Publish the provider’s hosted signup page and copy its **public HTTPS URL**. Do not paste an admin URL, API key, or embedded-form action URL.
2. Put that URL in `site-config.js` as `newsletterSignupUrl`. The site will change the “Stay close” button from Instagram to “Join the email list” automatically. Visitors will complete signup on the provider’s hosted page, where confirmation and unsubscribe settings live.
3. Run a real test with an address not already on the audience: open the site on desktop and phone, follow the button, submit the form, receive the confirmation email, confirm, receive the welcome email, and verify the subscriber appears once in the audience. Test the unsubscribe path too.
4. Then link the same signup URL from Instagram, Facebook, YouTube, and the showcase announcement. Mark the mailing-list item complete only after the end-to-end test passes.

For Mailchimp, its [hosted form instructions](https://mailchimp.com/help/create-a-hosted-signup-form/) cover the signup, confirmation, opt-in email, and success pages. Its [audience settings](https://mailchimp.com/help/create-audience/) include double opt-in. The [FTC’s CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) explains the mailing address and unsubscribe requirements for commercial email.
