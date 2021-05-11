<?php

error_reporting(E_ERROR | E_PARSE);

$the_URL = (explode('?u=', $_SERVER['REQUEST_URI'])[1]);

function proxify($url)
{
    $fail_counter = 0;
    $content = file_get_contents($url);
    while (!$content) {
        $content = file_get_contents($url);
        if (++$fail_counter > 3) {
            break;
        }
    }
    return $content;
}

echo proxify($the_URL);
