<?php
declare(strict_types=1);
// Keep this file on the same server as the PWA. Do not publish the private key elsewhere.
return [
    'vapid_subject' => 'mailto:admin@example.com', // Change to a contact email you control.
    'vapid_public' => 'BERo6vDZ3FXVazZ-OlcO_vVs1GkrGQ8aR_BnarnUO8lZNhbnH9JHk-AOaCfKZp4Sk8Q5CO0RH9NTEI95GeUUm7U',
    'vapid_private_pem' => <<<'PEM'
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg+BV0svRFu7dLJCT6
13j0kt7bfxj+qSxXy5SQjoPPnOOhRANCAAREaOrw2dxV1Ws2fjpXDv71bNRpKxkP
GkfwZ2q51DvJWTYW5x/SR5PgDmgnymaeEpPEOQjtER/TUxCPeRnlFJu1
-----END PRIVATE KEY-----
PEM,
    'cron_secret' => 'N3P-No1DPkJ43PKGb7cNk2oeYCSSSlMifVb8T5kgkgDcOLN3',
    'data_dir' => __DIR__ . '/data',
];
