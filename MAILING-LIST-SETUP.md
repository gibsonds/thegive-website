# Mailing list launch setup

Status (October 3, 2026): Brevo is the mailing-list provider. `The Give Updates` contains four band members who confirmed they want updates. The hosted form `The Give email updates` is saved with double confirmation. Brevo shows `thegivect.com` as authenticated and branded. The site now links to the hosted form. A fresh-address signup and confirmation test is still pending.

## Decisions and access

1. Brevo is owned by David Gibson. Keep its credentials and any future API keys out of this repository.
2. Use the verified `thegivect.com` domain for campaign sending. The current Gmail sender is verified but Brevo flags its deliverability. Confirm the final sender and reply-to address before the first campaign.
3. Brevo has a mailing address in the account profile. Check the address displayed in a campaign footer before sending; use a band mailing address or registered PO box if the home address should not be public.
4. Keep `The Give Updates` as the single audience. Its signup form uses double confirmation. The four imported contacts were added after David confirmed that each band member agreed to receive updates.

## Copy ready for the provider

Signup heading: **Hear what The Give is doing next**

Signup description: “Get occasional emails about new music and shows from The Give. No filler. Unsubscribe whenever you like.”

Confirmation prompt: “Check your inbox and confirm your address to join The Give’s email list.”

Welcome email subject: **You’re on The Give list**

Welcome email body:

> Thanks for joining us. We’ll send occasional notes about new music and shows. In the meantime, hear the recordings at https://thegivect.com/ .
>
> The Give

Add the provider’s unsubscribe link and the band’s confirmed mailing address through its standard campaign footer.

Privacy copy to review before publication: “The Give uses Brevo to collect your email address and send occasional updates about music and shows. We use your address for these updates. You can unsubscribe from any email. Questions: thegivebandct@gmail.com.”

## Connect the website

1. The public HTTPS Brevo signup page is set in `site-config.js` as `newsletterSignupUrl`. The site changes the “Stay close” button from Instagram to “Join the email list” automatically. Visitors complete signup on Brevo’s hosted page, where confirmation and unsubscribe settings live.
2. Run a real test with an address not already on the audience: open the site on desktop and phone, follow the button, submit the form, receive the confirmation email, confirm, and verify the subscriber appears once in the audience. If a welcome email is configured, verify it too. Test the unsubscribe path before the first campaign.
3. Then link the same signup URL from Instagram, Facebook, YouTube, and the showcase announcement. Mark the mailing-list item complete only after the end-to-end test passes.

Brevo's [domain setup instructions](https://help.brevo.com/hc/en-us/articles/35337929909778-Set-up-your-domain-in-Brevo) cover its DNS records. The [FTC’s CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide) explains the mailing address and unsubscribe requirements for commercial email.
