<?php

namespace Laswitchtech\CoreWeb\Plugin;

class TelicoSmsSanitizer
{
    /**
     * Sanitize SMS message content for Telico API compatibility
     *
     * @param string $message The original message to sanitize
     * @return string The sanitized message
     */
    public static function sanitize(string $message): string
    {
        // Convert common Unicode punctuation to ASCII equivalents
        $search = [
            '—', '–', '−',  // em-dash, en-dash, minus sign
            '“', '”', '„',  // double quotes
            '‘', '’', '‚',  // single quotes
            '…',           // ellipsis
            "\xC2\xA0",     // non-breaking space (UTF-8)
        ];
        
        $replace = [
            '-', '-', '-',    // dashes
            '"', '"', '"',   // double quotes
            "'", "'", "'",   // single quotes
            '...',           // ellipsis
            ' ',             // nbsp
        ];

        $sanitized = str_replace($search, $replace, $message);

        // Normalize line endings to LF
        $sanitized = str_replace(["\r\n", "\r"], "\n", $sanitized);

        // Remove or replace any remaining non-ASCII characters with safe replacements
        $sanitized = preg_replace('/[^\x20-\x7E\n]/', '', $sanitized);
        
        // Trim outer whitespace
        $sanitized = trim($sanitized);

        return $sanitized;
    }
}