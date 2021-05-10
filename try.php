<?php
echo file_get_contents((explode('?u=', $_SERVER['REQUEST_URI'])[1]));
