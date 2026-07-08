<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Message\SmsProviderInterface;
use Laswitchtech\CoreWeb\Message\SmsResult;

final class TelicoProvider implements SmsProviderInterface
{
    private string $username;
    private string $smsPass;
    private string $callerid;

    public function __construct(array $config)
    {
        $this->username = $config['username'] ?? '';
        $this->smsPass = $config['sms_pass'] ?? '';
        $this->callerid = $config['callerid'] ?? '';
    }

    public function name(): string
    {
        return 'telico';
    }

    public function send(string $to, string $body, array $options = []): SmsResult
    {
        // Validate required credentials
        if (empty($this->username) || empty($this->smsPass) || empty($this->callerid)) {
            return SmsResult::fail('Telico provider requires username, sms_pass, and callerid configuration');
        }

        // Check if curl extension is available
        if (!function_exists('curl_init')) {
            return SmsResult::fail('PHP curl extension is required.');
        }

        // Sanitize the message body for Telico API compatibility
        $sanitizedBody = TelicoSmsSanitizer::sanitize($body);

        // Prepare the request parameters
        $params = [
            "source_did" => $this->callerid,
            "destination" => $to,
            "message" => $sanitizedBody
        ];

        // Build the URL with query parameters
        $baseUrl = "https://sms.telico.cloud/api/send_sms";
        $url = $baseUrl . "?" . http_build_query($params);

        // Initialize cURL session
        $ch = curl_init($url);
        if ($ch === false) {
            return SmsResult::fail('Failed to initialize cURL session');
        }
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->username}:{$this->smsPass}");
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        $errno = curl_errno($ch);
        
        // curl_close is deprecated since PHP 8.5 as it has no effect since PHP 8.0
        // No need to call it explicitly

        // Handle cURL errors
        if ($error) {
            return SmsResult::fail("cURL error: {$error}");
        }

        // Check for curl_exec failure
        if ($response === false) {
            return SmsResult::fail('Failed to execute cURL request');
        }

        // Parse the response (attempt to parse JSON)
        $result = json_decode($response, true);
        
        // Check for valid response 
        if (!\is_array($result)) {
            return SmsResult::fail('Invalid Telico API response: Expected JSON array');
        }
        
        // Handle HTTP error codes with better provider-specific error messages
        if ($httpCode >= 400) {
            if (isset($result['error'])) {
                return SmsResult::fail("Telico API error: {$result['error']}");
            } else {
                return SmsResult::fail("HTTP {$httpCode}: Send failed");
            }
        }
        
        // Check for valid response - conservative approach
        if (isset($result['status']) && $result['status'] === 'success') {
            return SmsResult::ok($result['message_id'] ?? null, $result);
        } elseif (isset($result['error'])) {
            return SmsResult::fail("Telico API error: {$result['error']}");
        } else {
            // Provide a compact preview of the JSON for debugging purposes
            $jsonPreview = strlen(json_encode($result)) > 100 ? 
                substr(json_encode($result), 0, 97) . '...' : 
                json_encode($result);
            return SmsResult::fail("Unexpected Telico API response: {$jsonPreview}");
        }
    }
}