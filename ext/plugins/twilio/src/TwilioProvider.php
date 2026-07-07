<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Message\SmsProviderInterface;
use Laswitchtech\CoreWeb\Message\SmsResult;

final class TwilioProvider implements SmsProviderInterface
{
    private string $accountSid;
    private string $authToken;
    private string $from;

    public function __construct(array $config)
    {
        $this->accountSid = $config['account_sid'] ?? '';
        $this->authToken = $config['auth_token'] ?? '';
        $this->from = $config['from'] ?? '';
    }

    public function name(): string
    {
        return 'twilio';
    }

    public function send(string $to, string $body, array $options = []): SmsResult
    {
        // Validate required credentials
        if (empty($this->accountSid) || empty($this->authToken)) {
            return SmsResult::fail('Twilio provider requires account_sid and auth_token configuration');
        }

        // Check if curl extension is available
        if (!function_exists('curl_init')) {
            return SmsResult::fail('PHP curl extension is required.');
        }

        // If no from number is provided, use the default config value
        $from = $options['from'] ?? $this->from;
        if (empty($from)) {
            return SmsResult::fail('From number is required for Twilio delivery');
        }

        // Prepare Twilio API request data 
        $postData = [
            'To' => $to,
            'Body' => $body,
            'From' => $from
        ];

        // Build the URL with query parameters
        $baseUrl = "https://api.twilio.com/2010-04-01/Accounts/{$this->accountSid}/Messages.json";
        
        // Initialize cURL session for POST request
        $ch = curl_init($baseUrl);
        if ($ch === false) {
            return SmsResult::fail('Failed to initialize cURL session');
        }
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->accountSid}:{$this->authToken}");
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);

        // Handle cURL errors
        if ($error) {
            return SmsResult::fail("cURL error: {$error}");
        }

        // Check for curl_exec failure
        if ($response === false) {
            return SmsResult::fail('Failed to execute cURL request');
        }

        // Parse the JSON response
        $result = json_decode($response, true);
        
        // Check for valid response 
        if (!\is_array($result)) {
            return SmsResult::fail('Invalid Twilio API response: Expected JSON array');
        }
        
        // Handle HTTP error codes with better provider-specific error messages
        if ($httpCode >= 400) {
            if (isset($result['message']) || isset($result['error'])) {
                $errorMessage = $result['message'] ?? $result['error'];
                return SmsResult::fail("Twilio API error: {$errorMessage}");
            } else {
                return SmsResult::fail("HTTP {$httpCode}: Twilio API request failed");
            }
        }
        
        if (isset($result['sid'])) {
            return SmsResult::ok($result['sid'], $result);
        } else {
            return SmsResult::fail('Unexpected Twilio API response');
        }
    }
}