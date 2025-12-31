<?php
// Handle API actions
$action = isset($_GET['action']) ? $_GET['action'] : null;

if ($action === 'loadfile') {
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $filename = isset($_GET['filename']) ? $_GET['filename'] : 'default';

    // Validate filename - must match note name pattern (start with letter or underscore)
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename']);
        exit;
    }

    $filepath = __DIR__ . '/' . $filename . '.nts';

    if (!file_exists($filepath)) {
        // Return default empty structure if file doesn't exist
        // Use the filename as the root note name
        echo json_encode([
            'name' => $filename
        ]);
        exit;
    }

    $content = file_get_contents($filepath);

    if ($content === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read file']);
        exit;
    }

    // Return the raw JSON content
    echo $content;
    exit;
}

if ($action === 'savefile') {
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['filename']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing filename or content']);
        exit;
    }

    $filename = $input['filename'];
    $content = $input['content'];

    // Validate filename - must match note name pattern (start with letter or underscore)
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename']);
        exit;
    }

    $filepath = __DIR__ . '/' . $filename . '.nts';

    if (file_put_contents($filepath, $content) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'createfile') {
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['filename'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing filename']);
        exit;
    }

    $filename = $input['filename'];

    // Validate filename - must match note name pattern (start with letter or underscore)
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename']);
        exit;
    }

    $filepath = __DIR__ . '/' . $filename . '.nts';

    if (file_exists($filepath)) {
        http_response_code(400);
        echo json_encode(['error' => 'File already exists']);
        exit;
    }

    // Create file with just the root note name
    $content = json_encode(['name' => $filename], JSON_PRETTY_PRINT);
    if (file_put_contents($filepath, $content) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create file']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'renamefile') {
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['oldname']) || !isset($input['newname'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing oldname or newname']);
        exit;
    }

    $oldname = $input['oldname'];
    $newname = $input['newname'];

    // Validate filenames
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $oldname) || !preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $newname)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename']);
        exit;
    }

    $oldpath = __DIR__ . '/' . $oldname . '.nts';
    $newpath = __DIR__ . '/' . $newname . '.nts';

    if (!file_exists($oldpath)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }

    if (file_exists($newpath)) {
        http_response_code(400);
        echo json_encode(['error' => 'Target file already exists']);
        exit;
    }

    if (!rename($oldpath, $newpath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to rename file']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'deletefile') {
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['filename'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing filename']);
        exit;
    }

    $filename = $input['filename'];

    // Validate filename
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $filename)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename']);
        exit;
    }

    $filepath = __DIR__ . '/' . $filename . '.nts';

    if (!file_exists($filepath)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }

    if (!unlink($filepath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete file']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

$icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IB2cksfwAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+kMHAItNCC6n/gAAAQtSURBVHja7ZtbbBRVGMd/35ntbmmFLpdFpd02pQQvbelWeDDeHrQ3lKAhClGjiTGiMdE3EROJEhNLvMT4QEQSNIRLMEoTSPpAWx/kIpqIlFJsMaVloRVLWSy9Qbsz8/lASlC5+ELS7p7/0zkzcyb5/875vjnfSUa4gYqKSqIFEf9lH1aMJomeH2LKpTExTGBNCanOmkpy5jT68yP+9+Fs8/EHm347fL3n5VoX8/LKcmdNdz8aGNZnPRVhEssIlM/Vzvm5/vJ1m9sP3RRAtLB4adDhG9cjM8OBqphLRcynJKrcHlayQjqhDY+MCr39QutpoanZ0NAcIOlBVgituc9797Pt7R9eF0B+4b1vGJHPVZHqmMfqZUmiEZ3MC4BT54R1OzNoaHYwAjXl7pYvdh5/cfy+c/XMOyKbBWTVsiRrlifJyWbSKycLnljkkRmEH9sdOv40ZS8tnpn86ei5fVcA5OWV5WYE9AdVgquWJXml0iXVtLDIJ5QB+9scTvWZR5+rmbHj55ZEwgA4Ge5aXzWrOualpPlxraxyqYz5DI8ifQmzA0CKikqinvonA0ZMw3uXJn3M30zxPqF6bSYoPBYz9xjX1ydVxVTF3JQ3D1AQUSrLPFwfDO5bBuFxgIqYT7qooswDoCeh1UaVeQCl+ekDYEHB5ZWeGJIZxsAcgEiOpg2A2eHLk31+UEJGIRsgO5Q2/q94vTgmxpDmsgAsgDSXFBQW3zD9xwp9vls1iuvDg6szSQxKagLo6tifVjNfOO8hGwLXBOB6HtWLX2Dla++kZP9/JUERQa46Cky1vs0BNgfYfYAFYAFYABaABWABWAAWwM3PAyaKysuLqfv2S1zP4/4HniKR+MueB9hawOYAC8ACsAAsAAvAArAALAALwAK4ZdXgrarCJhwAWw3aHGABpC2AQYDhkYtpY3poaHi8OWCAMwBne/vSBkBvb2K82WMQTgC0tB5PGwAtre3jzU6DUg/Q1LgvbQCMexWReuM6zi7A3dO4l/ipnpQ333XyNHsa9yrgumPObtPT0dINfJ1MutSuW5/S5lWV2tr1eJ4nKrKpu/tIjwMwbeqMQ+I4r544EQ9mZoZYtHBBSgLYsHEbW7bWAVwwytP9/X1DDsDAQGIwJxxpFVhx8OCvEgoFUwqCqrJh4zY++XQjquoj8ky869hhuOq/wQv9fb+Hp88+r6o1Bw78Im1tHZSW3kU4PG3Sx/zbq2vZsrXusnl4M951bNuVYujfA/LnliwxsF1VpwYCDlUVj1BZ9TClxXdzx50RsrOmTGjDwyMXOfPHWY4eO05T4z4amvbiuh7ABUSej3e21v+jGrzWS+bMnz8rmAysUeR1IDDJI8AV+Ep9//14vO3Mf8rhG43MyyvLDQS9peqzBNFCIArcNtF3usBpoFNE6t0xZ3d395Hrft//Bqgc3LEUIT/bAAAAAElFTkSuQmCC";

$notesParam = isset($_GET['notes']) ? $_GET['notes'] : null;

// If no notes parameter, show file listing
if ($notesParam === null) {
    $ntsFiles = glob('*.nts');
    // Sort by modification time (most recent first)
    usort($ntsFiles, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Web Notes - Select Notes File</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
	<link rel="icon" type="image/x-icon" href="<?php echo($icon) ?>" />
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
            }
            h1 { margin-bottom: 20px; }
            .file-list {
                list-style: none;
                padding: 0;
            }
            .file-list li {
                margin: 10px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .file-list a {
                flex: 1;
                padding: 15px 20px;
                background: #f5f5f5;
                border-radius: 8px;
                text-decoration: none;
                color: #333;
                font-size: 18px;
            }
            .file-list a:hover {
                background: #e0e0e0;
            }
            .file-list .file-btn {
                padding: 10px 12px;
                font-size: 14px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .file-list .btn-rename {
                background: #f0ad4e;
                color: white;
            }
            .file-list .btn-rename:hover {
                background: #ec971f;
            }
            .file-list .btn-delete {
                background: #d9534f;
                color: white;
            }
            .file-list .btn-delete:hover {
                background: #c9302c;
            }
            .new-file {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
            .new-file input {
                padding: 10px 15px;
                font-size: 16px;
                border: 1px solid #ccc;
                border-radius: 4px;
                width: 200px;
            }
            .new-file button {
                padding: 10px 20px;
                font-size: 16px;
                background: #4080ff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-left: 10px;
            }
            .new-file button:hover {
                background: #3070e0;
            }
            .empty-message {
                color: #666;
                font-style: italic;
            }
            .header-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #btn-night {
                padding: 8px 12px;
                font-size: 18px;
                background: #e0e0e0;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            #btn-night:hover {
                background: #d0d0d0;
            }
            /* Night mode styles */
            body.night-mode {
                background: #1a1a2e;
                color: #e0e0e0;
            }
            body.night-mode .file-list a {
                background: #2a2a4e;
                color: #e0e0e0;
            }
            body.night-mode .file-list a:hover {
                background: #3a3a5e;
            }
            body.night-mode .new-file {
                border-top-color: #444;
            }
            body.night-mode .new-file input {
                background: #2a2a4e;
                border-color: #444;
                color: #e0e0e0;
            }
            body.night-mode .new-file button {
                background: #3060c0;
            }
            body.night-mode .new-file button:hover {
                background: #2050b0;
            }
            body.night-mode #btn-night {
                background: #3a3a5e;
                color: #e0e0e0;
            }
            body.night-mode #btn-night:hover {
                background: #4a4a6e;
            }
            body.night-mode .empty-message {
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="header-row">
            <h1>Web Notes</h1>
            <button id="btn-night" title="Toggle Night Mode">&#9681;</button>
        </div>
        <h2>Select a notes file:</h2>
        <?php if (count($ntsFiles) > 0): ?>
            <ul class="file-list">
                <?php foreach ($ntsFiles as $file):
                    $name = pathinfo($file, PATHINFO_FILENAME);
                ?>
                    <li>
                        <a href="?notes=<?php echo urlencode($name); ?>"><?php echo htmlspecialchars($name); ?></a>
                        <button class="file-btn btn-rename" data-name="<?php echo htmlspecialchars($name); ?>" title="Rename">&#9998;</button>
                        <button class="file-btn btn-delete" data-name="<?php echo htmlspecialchars($name); ?>" title="Delete">&#10005;</button>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php else: ?>
            <p class="empty-message">No notes files found.</p>
        <?php endif; ?>

        <div class="new-file">
            <h3>Create new notes file:</h3>
            <form id="createForm">
                <input type="text" id="newNotesName" placeholder="Enter name..." pattern="[a-zA-Z_][a-zA-Z0-9_]*" title="Notes name must be a proper identifier" required>
                <button type="submit">Create</button>
            </form>
        </div>
        <script>
            const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

            document.getElementById('createForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const name = document.getElementById('newNotesName').value.trim();
                if (!validPattern.test(name)) {
                    alert('Notes name must be a proper identifier.');
                    return;
                }
                try {
                    const response = await fetch('?action=createfile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: name })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        document.getElementById('newNotesName').value = '';
                        location.reload();
                    } else {
                        alert(result.error || 'Failed to create file');
                    }
                } catch (err) {
                    alert('Error creating file: ' + err.message);
                }
            });

            document.querySelectorAll('.btn-rename').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const oldName = this.dataset.name;
                    const newName = prompt('Enter new name:', oldName);
                    if (newName === null || newName === oldName) return;
                    if (!validPattern.test(newName)) {
                        alert('Notes name must be a proper identifier.');
                        return;
                    }
                    try {
                        const response = await fetch('?action=renamefile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ oldname: oldName, newname: newName })
                        });
                        const result = await response.json();
                        if (response.ok) {
                            location.reload();
                        } else {
                            alert(result.error || 'Failed to rename file');
                        }
                    } catch (err) {
                        alert('Error renaming file: ' + err.message);
                    }
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const name = this.dataset.name;
                    if (!confirm('Delete "' + name + '"?')) return;
                    try {
                        const response = await fetch('?action=deletefile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: name })
                        });
                        const result = await response.json();
                        if (response.ok) {
                            location.reload();
                        } else {
                            alert(result.error || 'Failed to delete file');
                        }
                    } catch (err) {
                        alert('Error deleting file: ' + err.message);
                    }
                });
            });

            // Night mode
            if (localStorage.getItem('nightMode') === 'true') {
                document.body.classList.add('night-mode');
            }
            document.getElementById('btn-night').addEventListener('click', function() {
                const isNight = document.body.classList.toggle('night-mode');
                localStorage.setItem('nightMode', isNight);
            });
        </script>
    </body>
    </html>
    <?php
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Web Notes</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    <link rel="icon" type="image/x-icon" href="<?php echo($icon) ?>" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            height: 100%;
            height: 100dvh;
            overflow: hidden;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100%;
            height: 100dvh;
            display: flex;
            overflow: hidden;
        }

        /* Night mode */
        body.night-mode {
            background: #1a1a1a;
            color: #e0e0e0;
        }

        body.night-mode #sidebar {
            background: #252525;
            border-right-color: #404040;
        }


        body.night-mode .note-toggle:hover {
            background: #404040;
        }

        body.night-mode #sidebar-buttons {
            border-top-color: #404040;
        }

        body.night-mode #sidebar-buttons button {
            background: #333;
            border-color: #505050;
            color: #e0e0e0;
        }

        body.night-mode #sidebar-buttons button:hover {
            background: #404040;
        }

        body.night-mode #btn-save.dirty {
            background: #e74c3c;
            border-color: #c0392b;
        }

        body.night-mode #tabs {
            background: #252525;
            border-bottom-color: #404040;
        }

        body.night-mode .tab {
            background: #333;
            border-right-color: #404040;
            color: #e0e0e0;
        }

        body.night-mode .tab:hover {
            background: #404040;
        }

        body.night-mode .tab.active {
            background: #1a1a1a;
            border-bottom-color: #1a1a1a;
        }

        body.night-mode .tab-close:hover {
            background: #505050;
        }

        body.night-mode #tab-add {
            color: #999;
        }

        body.night-mode #tab-add:hover {
            background: #404040;
        }

        body.night-mode #editor {
            background: #1a1a1a;
            color: #e0e0e0;
        }

        body.night-mode #context-menu {
            background: #333;
            border-color: #505050;
        }

        body.night-mode .context-item:hover {
            background: #404040;
        }

        body.night-mode .context-separator {
            background: #505050;
        }

        body.night-mode .drop-zone.drag-over {
            background: #4080ff;
        }

        body.night-mode .note-item.drag-over {
            background: #3a4a6a;
            outline-color: #4080ff;
        }

        /* Sidebar */
        #sidebar {
            width: 250px;
            min-width: 0;
            background: #f5f5f5;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }

        #sidebar-resizer {
            width: 15px;
            background: #e0e0e0;
            cursor: ew-resize;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-right: 1px solid #ddd;
            touch-action: none;
            overscroll-behavior: none;
            -webkit-user-select: none;
            user-select: none;
        }

        #sidebar-resizer:hover,
        #sidebar-resizer.dragging {
            background: #d0d0d0;
        }

        #sidebar-resizer::after {
            content: '⋮';
            color: #888;
            font-size: 16px;
        }

        body.night-mode #sidebar-resizer {
            background: #2a2a2a;
            border-right-color: #404040;
        }

        body.night-mode #sidebar-resizer:hover,
        body.night-mode #sidebar-resizer.dragging {
            background: #3a3a3a;
        }

        body.night-mode #sidebar-resizer::after {
            color: #666;
        }

        #hierarchy {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
            min-height: 0;
        }

        .note-item {
            display: flex;
            align-items: center;
            padding: 3px 8px;
            cursor: pointer;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: none;
        }

        .note-item.active {
            background: #d0e0ff;
        }

        body.night-mode .note-item.active {
            background: #2a3a5a;
        }

        .note-item.drag-over {
            background: #c0d0ff;
            outline: 2px dashed #4080ff;
        }

        .note-toggle {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 6px;
            cursor: pointer;
            font-size: 10px;
            color: #666;
            flex-shrink: 0;
            border-radius: 3px;
        }

        .note-toggle:hover {
            background: #d0d0d0;
            color: #333;
        }

        .note-toggle.empty {
            visibility: hidden;
        }

        .note-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 2px 0;
        }

        .drop-zone {
            height: 5px;
            margin: 0;
            margin-right: 10px;
            border-radius: 2px;
            transition: height 0.1s, background 0.1s;
            box-sizing: border-box;
        }

        .drop-zone.drag-over {
            height: 36px;
            background: #4080ff;
        }

        #sidebar-buttons {
            display: flex;
            border-top: 1px solid #ddd;
            padding: 8px;
            gap: 8px;
            flex-shrink: 0;
        }

        #sidebar-buttons button {
            flex: 1;
            padding: 8px;
            font-size: 16px;
            cursor: pointer;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: #fff;
        }

        #sidebar-buttons button:hover {
            background: #e8e8e8;
        }

        #btn-save.dirty {
            background: #e74c3c;
            border-color: #c0392b;
        }

        /* Main area */
        #main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
        }

        /* Tabs */
        #tabs {
            display: flex;
            background: #e8e8e8;
            border-bottom: 1px solid #ddd;
            overflow-x: auto;
            overflow-y: hidden;
            flex-shrink: 0;
        }

        .tab {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-right: 1px solid #ddd;
            cursor: pointer;
            white-space: nowrap;
            background: #e0e0e0;
            max-width: 200px;
        }

        .tab:hover {
            background: #d0d0d0;
        }

        .tab.active {
            background: #fff;
            border-bottom: 1px solid #fff;
            margin-bottom: -1px;
        }

        body.night-mode .tab.active {
            background: #1a1a1a;
            border-bottom-color: #1a1a1a;
        }

        .tab-name {
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: 8px;
        }

        .tab-close {
            margin-left: auto;
            width: 18px;
            height: 18px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #666;
        }

        .tab-close:hover {
            background: #c0c0c0;
            color: #333;
        }

        #tab-add {
            padding: 8px 12px;
            cursor: pointer;
            background: transparent;
            border: none;
            font-size: 18px;
            color: #666;
        }

        #tab-add:hover {
            background: #d0d0d0;
        }

        /* Editor */
        #editor-container {
            flex: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        #editor {
            flex: 1;
            width: 100%;
            padding: 15px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            border: none;
            resize: none;
            outline: none;
            min-height: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        #editor::selection {
            background: #FFB830;
            color: #000;
        }

        #editor::-moz-selection {
            background: #FFB830;
            color: #000;
        }

        #status-bar {
            padding: 4px 15px;
            font-size: 12px;
            color: #666;
            background: #f0f0f0;
            border-top: 1px solid #ddd;
            flex-shrink: 0;
        }

        body.night-mode #status-bar {
            background: #252525;
            border-top-color: #404040;
            color: #999;
        }

        /* Find bar */
        #find-bar {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 6px 10px;
            background: #f0f0f0;
            border-top: 1px solid #ddd;
            font-size: 13px;
            flex-shrink: 0;
        }

        body.night-mode #find-bar {
            background: #252525;
            border-top-color: #404040;
        }

        #find-row, #replace-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        #find-input, #replace-input {
            flex: 1 1 150px;
            min-width: 100px;
            padding: 4px 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            font-size: 13px;
        }

        body.night-mode #find-input,
        body.night-mode #replace-input {
            background: #333;
            border-color: #505050;
            color: #e0e0e0;
        }

        #find-bar button {
            padding: 4px 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            background: #fff;
            cursor: pointer;
            font-size: 12px;
        }

        #find-bar button:hover {
            background: #e8e8e8;
        }

        body.night-mode #find-bar button {
            background: #333;
            border-color: #505050;
            color: #e0e0e0;
        }

        body.night-mode #find-bar button:hover {
            background: #404040;
        }

        #find-bar label {
            display: flex;
            align-items: center;
            gap: 3px;
            cursor: pointer;
            white-space: nowrap;
        }

        body.night-mode #find-bar label {
            color: #e0e0e0;
        }

        #find-status {
            flex: 1;
            color: #666;
            font-size: 12px;
        }

        body.night-mode #find-status {
            color: #999;
        }

        #find-close {
            margin-left: auto;
        }

        /* Link hover overlay */
        #link-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            overflow: hidden;
        }

        .link-highlight {
            position: absolute;
            background: rgba(64, 128, 255, 0.15);
            border-radius: 3px;
            pointer-events: auto;
            cursor: pointer;
        }

        .link-highlight:hover {
            background: rgba(64, 128, 255, 0.4);
        }

        body.night-mode .link-highlight {
            background: rgba(64, 128, 255, 0.2);
        }

        body.night-mode .link-highlight:hover {
            background: rgba(64, 128, 255, 0.5);
        }

        /* Context Menu */
        #context-menu {
            position: fixed;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            min-width: 150px;
            display: none;
        }

        .context-item {
            padding: 8px 15px;
            cursor: pointer;
        }

        .context-item:hover {
            background: #f0f0f0;
        }

        .context-separator {
            height: 1px;
            background: #ddd;
            margin: 4px 0;
        }
    </style>
</head>
<body>
    <div id="sidebar">
        <div id="hierarchy"></div>
        <div id="sidebar-buttons">
            <button id="btn-save" title="Save">&#128190;</button>
            <button id="btn-find" title="Find">&#128269;</button>
            <button id="btn-new" title="New Note">&#10133;</button>
            <button id="btn-back" title="Back to Notes List">&#8592;</button>
        </div>
    </div>
    <div id="sidebar-resizer"></div>
    <div id="main">
        <div id="tabs">
            <button id="tab-add" title="New Tab">+</button>
        </div>
        <div id="editor-container">
            <textarea id="editor"></textarea>
            <div id="link-overlay"></div>
        </div>
        <div id="find-bar" style="display: none;">
            <div id="find-row">
                <input type="text" id="find-input" placeholder="Find...">
                <button id="find-prev" title="Previous">&#9650;</button>
                <button id="find-next" title="Next">&#9660;</button>
                <label><input type="checkbox" id="find-regex"> Regex</label>
                <label><input type="checkbox" id="find-case"> Match case</label>
                <label><input type="checkbox" id="find-all"> All notes</label>
                <span id="find-status"></span>
                <button id="find-close" title="Close">&#10005;</button>
            </div>
            <div id="replace-row">
                <input type="text" id="replace-input" placeholder="Replace...">
                <button id="replace-one" title="Replace">Replace</button>
                <button id="replace-all" title="Replace All">Replace All</button>
            </div>
        </div>
        <div id="status-bar">Ln 1, Col 1</div>
    </div>

    <div id="context-menu">
        <div class="context-item" data-action="new">New note</div>
        <div class="context-separator"></div>
        <div class="context-item" data-action="rename">Rename</div>
        <div class="context-item" data-action="duplicate">Duplicate</div>
        <div class="context-item" data-action="delete">Delete</div>
        <div class="context-separator"></div>
        <div class="context-item" data-action="copy-name">Copy name</div>
        <div class="context-item" data-action="copy-path">Copy path</div>
        <div class="context-separator"></div>
        <div class="context-item" data-action="bound-copy">Create bound copy</div>
        <div class="context-item" data-action="properties">Properties</div>
    </div>

    <script>
        // State
        let notesData = { name: 'root', text: '', children: [] };
        let tabs = [];
        let tabStates = []; // Stores {scrollTop, selectionStart, selectionEnd} for each tab
        let activeTabIndex = 0;
        let isDirty = false;
        let saveTimer = null;
        let contextMenuTarget = null;
        let collapsedPaths = new Set();

        // Touch drag state
        let touchDragPath = null;
        let touchDragElement = null;
        let touchDragClone = null;
        let touchDragStartX = 0;
        let touchDragStartY = 0;
        let touchDragStarted = false;
        let touchDragCancelled = false;

        // Apply night mode on load
        if (localStorage.getItem('nightMode') === 'true') {
            document.body.classList.add('night-mode');
        }

        // Get the root path (dynamic, based on actual root name)
        function getRootPath() {
            return [notesData.name];
        }

        // Get filename from URL params
        function getNotesFilename() {
            const params = new URLSearchParams(window.location.search);
            return params.get('notes') || 'default';
        }

        // Valid note name pattern
        const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

        function isValidNoteName(name) {
            return validNamePattern.test(name);
        }

        // Case-insensitive name comparison
        function namesEqual(a, b) {
            return a.toLowerCase() === b.toLowerCase();
        }

        // Get note by path (case-insensitive)
        function getNoteByPath(path) {
            if (!path || path.length === 0) return null;
            let current = notesData;
            for (let i = 0; i < path.length; i++) {
                if (i === 0) {
                    if (!namesEqual(path[i], current.name)) return null;
                } else {
                    const child = current.children.find(c => namesEqual(c.name, path[i]));
                    if (!child) return null;
                    current = child;
                }
            }
            return current;
        }

        // Get parent note by path
        function getParentByPath(path) {
            if (!path || path.length <= 1) return null;
            return getNoteByPath(path.slice(0, -1));
        }

        // Find note by name (case-insensitive) - returns outermost (shallowest) match
        function findNoteByName(name, currentPath) {
            let allMatches = [];

            function searchInNote(note, path) {
                if (namesEqual(note.name, name)) {
                    allMatches.push(path);
                }
                for (const child of note.children) {
                    searchInNote(child, [...path, child.name]);
                }
            }

            searchInNote(notesData, getRootPath());

            if (allMatches.length === 0) return null;

            // Return the shallowest (outermost) match
            allMatches.sort((a, b) => a.length - b.length);
            return allMatches[0];
        }

        // Find note by path segments (case-insensitive)
        // First tries to resolve as if first segment is root
        // Then searches up from current note's hierarchy
        function findNoteByPathSegments(segments, currentPath) {
            if (segments.length === 0) return null;

            // Helper to try resolving remaining path from a starting note
            function tryResolvePath(startNote, startPath, remainingSegments) {
                let current = startNote;
                let path = [...startPath];

                for (const segment of remainingSegments) {
                    const child = current.children.find(c => namesEqual(c.name, segment));
                    if (!child) return null;
                    current = child;
                    path.push(child.name);
                }
                return path;
            }

            // First, try if first segment matches root name
            if (namesEqual(segments[0], notesData.name)) {
                const result = tryResolvePath(notesData, getRootPath(), segments.slice(1));
                if (result) return result;
            }

            // Collect all notes matching the first segment (outermost first)
            let firstSegmentMatches = [];
            function findFirstSegment(note, path) {
                if (namesEqual(note.name, segments[0])) {
                    firstSegmentMatches.push({ note, path });
                }
                for (const child of note.children) {
                    findFirstSegment(child, [...path, child.name]);
                }
            }
            findFirstSegment(notesData, getRootPath());

            // Sort by path length (shallowest/outermost first)
            firstSegmentMatches.sort((a, b) => a.path.length - b.path.length);

            // Try each match, resolve remaining path
            for (const match of firstSegmentMatches) {
                const result = tryResolvePath(match.note, match.path, segments.slice(1));
                if (result) return result;
            }

            return null;
        }

        // Deep clone a note
        function cloneNote(note) {
            return {
                name: note.name,
                text: note.text,
                children: note.children.map(c => cloneNote(c))
            };
        }

        // Update dirty indicator
        function updateDirtyIndicator() {
            const saveBtn = document.getElementById('btn-save');
            saveBtn.classList.toggle('dirty', isDirty);
        }

        // Mark as dirty and start autosave timer
        function markDirty() {
            const wasDirty = isDirty;
            isDirty = true;
            updateDirtyIndicator();
            if (!wasDirty) {
                if (saveTimer) clearTimeout(saveTimer);
                saveTimer = setTimeout(saveNotes, 60000);
            }
        }

        // Clean note data for saving - remove empty text and empty children arrays
        function cleanNoteForSave(note) {
            const cleaned = { name: note.name };

            // Only include text if non-empty after trimming
            if (note.text && note.text.trim() !== '') {
                cleaned.text = note.text;
            }

            // Recursively clean children
            if (note.children && note.children.length > 0) {
                const cleanedChildren = note.children.map(child => cleanNoteForSave(child));
                cleaned.children = cleanedChildren;
            }

            return cleaned;
        }

        // Normalize note data after loading - ensure text and children properties exist
        function normalizeNote(note) {
            if (typeof note.text !== 'string') {
                note.text = '';
            }
            if (!Array.isArray(note.children)) {
                note.children = [];
            }
            note.children.forEach(child => normalizeNote(child));
        }

        // Save notes to file
        async function saveNotes() {
            if (saveTimer) {
                clearTimeout(saveTimer);
                saveTimer = null;
            }

            try {
                const cleanedData = cleanNoteForSave(notesData);
                const response = await fetch('?action=savefile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: getNotesFilename(),
                        content: JSON.stringify(cleanedData, null, 2)
                    })
                });

                if (response.ok) {
                    isDirty = false;
                    updateDirtyIndicator();
                    console.log('Notes saved successfully');
                } else {
                    console.error('Failed to save notes');
                }
            } catch (err) {
                console.error('Error saving notes:', err);
            }
        }

        // Load notes from file
        async function loadNotes() {
            try {
                const response = await fetch(`?action=loadfile&filename=${encodeURIComponent(getNotesFilename())}`);
                if (response.ok) {
                    notesData = await response.json();
                    normalizeNote(notesData);
                    if (tabs.length === 0) {
                        addTab(getRootPath());
                    } else {
                        renderTabs();
                        updateEditor();
                    }
                    renderHierarchy();
                }
            } catch (err) {
                console.error('Error loading notes:', err);
            }
        }

        // Toggle collapsed state
        function toggleCollapsed(path) {
            const key = JSON.stringify(path);
            if (collapsedPaths.has(key)) {
                collapsedPaths.delete(key);
            } else {
                collapsedPaths.add(key);
            }
            renderHierarchy();
        }

        // Check if path is collapsed
        function isCollapsed(path) {
            return collapsedPaths.has(JSON.stringify(path));
        }

        // Create a drop zone element
        function createDropZone(level, targetInfo) {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.dataset.dropTarget = JSON.stringify(targetInfo);
            dropZone.dataset.dropInfo = JSON.stringify(targetInfo); // For touch drag
            // Use padding instead of margin so drop zone extends to left edge
            dropZone.style.paddingLeft = (10 + level * 15) + 'px';
            dropZone.style.marginLeft = '0';

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const sourcePath = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (targetInfo.type === 'before') {
                    reorderNote(sourcePath, targetInfo.path, 'before');
                } else if (targetInfo.type === 'after') {
                    reorderNote(sourcePath, targetInfo.path, 'after');
                }
            });

            return dropZone;
        }

        // Render hierarchy
        function renderHierarchy() {
            const container = document.getElementById('hierarchy');
            container.innerHTML = '';

            function renderNote(note, path, level, isLastChild) {
                const hasChildren = note.children.length > 0;
                const collapsed = isCollapsed(path);

                // Drop zone before this note (for reordering)
                if (path.length > 1) {
                    container.appendChild(createDropZone(level, { type: 'before', path: path }));
                }

                const div = document.createElement('div');
                div.className = 'note-item';
                // Add active class if this note is the current tab's note
                if (tabs.length > 0 && activeTabIndex < tabs.length) {
                    const currentPath = tabs[activeTabIndex];
                    if (JSON.stringify(path) === JSON.stringify(currentPath)) {
                        div.classList.add('active');
                    }
                }
                div.style.paddingLeft = (10 + level * 15) + 'px';
                div.dataset.path = JSON.stringify(path);
                div.draggable = path.length > 1;

                // Toggle arrow
                const toggle = document.createElement('span');
                toggle.className = 'note-toggle' + (hasChildren ? '' : ' empty');
                toggle.textContent = hasChildren ? (collapsed ? '\u25B6' : '\u25BC') : '';
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (hasChildren) {
                        toggleCollapsed(path);
                    }
                });
                div.appendChild(toggle);

                // Note name
                const nameSpan = document.createElement('span');
                nameSpan.className = 'note-name';
                nameSpan.textContent = note.name;

                // Track last tap time for double-tap detection
                let lastTapTime = 0;

                nameSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (tabs.length > 0) {
                        // If already on this note, don't do anything (preserves focus for Del key)
                        const currentPath = tabs[activeTabIndex];
                        if (JSON.stringify(path) === JSON.stringify(currentPath)) {
                            return;
                        }
                        saveTabState();
                        tabs[activeTabIndex] = path;
                        tabStates[activeTabIndex] = null; // Reset state for new note
                        // Invalidate search when switching notes with "all notes" off
                        if (!findAllNotes) {
                            invalidateSearch();
                        }
                        // Preserve hierarchy scroll position (relative to bottom for keyboard resilience)
                        const hierarchyEl = document.getElementById('hierarchy');
                        const distFromBottom = hierarchyEl.scrollHeight - hierarchyEl.scrollTop - hierarchyEl.clientHeight;
                        renderHierarchy();
                        hierarchyEl.scrollTop = hierarchyEl.scrollHeight - hierarchyEl.clientHeight - distFromBottom;
                        renderTabs();
                        updateEditor();
                    }
                });

                // Double-tap/double-click to rename - custom detection for better touch support
                nameSpan.addEventListener('touchend', (e) => {
                    const now = Date.now();
                    if (now - lastTapTime < 500) {
                        e.preventDefault();
                        renameNote(path);
                        lastTapTime = 0;
                    } else {
                        lastTapTime = now;
                    }
                });

                nameSpan.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    renameNote(path);
                });

                div.appendChild(nameSpan);

                div.addEventListener('click', (e) => {
                    if (e.target.classList.contains('note-toggle')) return;
                    if (e.target.classList.contains('note-name')) return;
                    if (tabs.length > 0) {
                        tabs[activeTabIndex] = path;
                        // Invalidate search when switching notes with "all notes" off
                        if (!findAllNotes) {
                            invalidateSearch();
                        }
                        // Preserve hierarchy scroll position (relative to bottom for keyboard resilience)
                        const hierarchyEl = document.getElementById('hierarchy');
                        const distFromBottom = hierarchyEl.scrollHeight - hierarchyEl.scrollTop - hierarchyEl.clientHeight;
                        renderHierarchy();
                        hierarchyEl.scrollTop = hierarchyEl.scrollHeight - hierarchyEl.clientHeight - distFromBottom;
                        renderTabs();
                        updateEditor();
                    }
                });

                div.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showContextMenu(e.clientX, e.clientY, path);
                });

                div.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify(path));
                    e.dataTransfer.effectAllowed = 'move';
                });

                div.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    div.classList.add('drag-over');
                });

                div.addEventListener('dragleave', () => {
                    div.classList.remove('drag-over');
                });

                div.addEventListener('drop', (e) => {
                    e.preventDefault();
                    div.classList.remove('drag-over');
                    const sourcePath = JSON.parse(e.dataTransfer.getData('text/plain'));
                    moveNote(sourcePath, path);
                });

                // Touch drag support - horizontal drag only to avoid conflict with scroll
                div.addEventListener('touchstart', (e) => {
                    if (path.length <= 1) return; // Can't drag root
                    touchDragPath = path;
                    touchDragElement = div;
                    touchDragStartX = e.touches[0].clientX;
                    touchDragStartY = e.touches[0].clientY;
                    touchDragStarted = false;
                    touchDragCancelled = false;
                }, { passive: true });

                div.addEventListener('touchmove', (e) => {
                    if (!touchDragPath || JSON.stringify(touchDragPath) !== JSON.stringify(path)) return;
                    if (touchDragCancelled) return;

                    const touch = e.touches[0];
                    const moveX = Math.abs(touch.clientX - touchDragStartX);
                    const moveY = Math.abs(touch.clientY - touchDragStartY);

                    // If vertical movement dominates, cancel drag and allow scroll
                    if (!touchDragStarted && moveY > 10 && moveY > moveX) {
                        touchDragCancelled = true;
                        touchDragPath = null;
                        return;
                    }

                    // Start drag after horizontal movement of 15px
                    if (!touchDragStarted && moveX > 15) {
                        touchDragStarted = true;
                        // Create visual clone
                        touchDragClone = div.cloneNode(true);
                        touchDragClone.style.position = 'fixed';
                        touchDragClone.style.pointerEvents = 'none';
                        touchDragClone.style.opacity = '0.7';
                        touchDragClone.style.zIndex = '1000';
                        touchDragClone.style.width = div.offsetWidth + 'px';
                        touchDragClone.style.background = document.body.classList.contains('night-mode') ? '#2a3a5a' : '#d0e0ff';
                        document.body.appendChild(touchDragClone);
                        div.style.opacity = '0.3';
                    }

                    if (touchDragStarted) {
                        e.preventDefault();
                        e.stopPropagation();
                        // Disable scroll on hierarchy while dragging
                        document.getElementById('hierarchy').style.overflow = 'hidden';
                        touchDragClone.style.left = touch.clientX - 20 + 'px';
                        touchDragClone.style.top = touch.clientY - 10 + 'px';

                        // Find element under touch
                        touchDragClone.style.display = 'none';
                        const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
                        touchDragClone.style.display = '';

                        // Clear previous drag-over states
                        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

                        // Highlight drop target
                        if (elementUnder) {
                            const noteItem = elementUnder.closest('.note-item');
                            const dropZone = elementUnder.closest('.drop-zone');
                            if (noteItem) noteItem.classList.add('drag-over');
                            if (dropZone) dropZone.classList.add('drag-over');
                        }
                    }
                }, { passive: false });

                div.addEventListener('touchend', (e) => {
                    if (!touchDragPath || !touchDragStarted) {
                        touchDragPath = null;
                        return;
                    }

                    // Find drop target
                    const touch = e.changedTouches[0];
                    if (touchDragClone) touchDragClone.style.display = 'none';
                    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);

                    // Clean up
                    if (touchDragClone) {
                        document.body.removeChild(touchDragClone);
                        touchDragClone = null;
                    }
                    if (touchDragElement) {
                        touchDragElement.style.opacity = '';
                    }
                    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                    // Restore scroll on hierarchy
                    document.getElementById('hierarchy').style.overflow = '';

                    // Perform drop
                    if (elementUnder) {
                        const noteItem = elementUnder.closest('.note-item');
                        const dropZone = elementUnder.closest('.drop-zone');
                        if (noteItem && noteItem.dataset.path) {
                            const targetPath = JSON.parse(noteItem.dataset.path);
                            moveNote(touchDragPath, targetPath);
                        } else if (dropZone && dropZone.dataset.dropInfo) {
                            const dropInfo = JSON.parse(dropZone.dataset.dropInfo);
                            reorderNote(touchDragPath, dropInfo.path, dropInfo.type);
                        }
                    }

                    touchDragPath = null;
                    touchDragStarted = false;
                });

                // Store path in dataset for touch drop detection
                div.dataset.path = JSON.stringify(path);

                container.appendChild(div);

                // Render children if not collapsed
                if (!collapsed && hasChildren) {
                    for (let i = 0; i < note.children.length; i++) {
                        const child = note.children[i];
                        const isLast = i === note.children.length - 1;
                        renderNote(child, [...path, child.name], level + 1, isLast);
                    }
                }

                // Drop zone after this note (for reordering)
                if (path.length > 1 && isLastChild) {
                    container.appendChild(createDropZone(level, { type: 'after', path: path }));
                }
            }

            renderNote(notesData, getRootPath(), 0, true);
        }

        // Reorder note (move to before/after another note)
        function reorderNote(sourcePath, targetPath, position) {
            if (sourcePath.length <= 1) return;
            if (JSON.stringify(sourcePath) === JSON.stringify(targetPath)) return;

            const sourceParent = getParentByPath(sourcePath);
            const sourceNote = getNoteByPath(sourcePath);
            if (!sourceParent || !sourceNote) return;

            const targetParent = getParentByPath(targetPath);
            if (!targetParent) return;

            // Check for name conflict if moving to different parent
            const sameParent = JSON.stringify(sourceParent) === JSON.stringify(targetParent);
            if (!sameParent) {
                if (targetParent.children.some(c => namesEqual(c.name, sourceNote.name))) {
                    alert('A note with that name already exists in the target location.');
                    return;
                }
            }

            // Get indices before any modifications
            const sourceIndex = sourceParent.children.findIndex(c => c.name === sourcePath[sourcePath.length - 1]);
            let targetIndex = targetParent.children.findIndex(c => c.name === targetPath[targetPath.length - 1]);

            if (sourceIndex === -1) return;

            // Remove from source
            sourceParent.children.splice(sourceIndex, 1);

            // Recalculate target index after removal if same parent
            if (sameParent) {
                targetIndex = targetParent.children.findIndex(c => c.name === targetPath[targetPath.length - 1]);
                if (targetIndex === -1) {
                    // Target was the source, insert at end
                    targetIndex = targetParent.children.length;
                }
            }

            if (position === 'before') {
                targetParent.children.splice(targetIndex, 0, sourceNote);
            } else if (position === 'after') {
                targetParent.children.splice(targetIndex + 1, 0, sourceNote);
            }

            const newPath = [...targetPath.slice(0, -1), sourceNote.name];
            updateTabsAfterMove(sourcePath, newPath);

            markDirty();
            renderHierarchy();
            renderTabs();
        }

        // Update tabs after moving a note
        function updateTabsAfterMove(oldPath, newPath) {
            tabs = tabs.map(tabPath => {
                if (JSON.stringify(tabPath.slice(0, oldPath.length)) === JSON.stringify(oldPath)) {
                    return [...newPath, ...tabPath.slice(oldPath.length)];
                }
                return tabPath;
            });
        }

        // Move note to new parent (drag into a note)
        function moveNote(sourcePath, targetPath) {
            if (sourcePath.length <= 1) return;
            if (JSON.stringify(sourcePath) === JSON.stringify(targetPath)) return;

            if (targetPath.length > sourcePath.length &&
                JSON.stringify(targetPath.slice(0, sourcePath.length)) === JSON.stringify(sourcePath)) {
                return;
            }

            const sourceParent = getParentByPath(sourcePath);
            const sourceNote = getNoteByPath(sourcePath);
            const targetNote = getNoteByPath(targetPath);

            if (!sourceParent || !sourceNote || !targetNote) return;

            if (targetNote.children.some(c => namesEqual(c.name, sourceNote.name))) {
                alert('A note with that name already exists in the target.');
                return;
            }

            const sourceIndex = sourceParent.children.findIndex(c => c.name === sourcePath[sourcePath.length - 1]);
            if (sourceIndex === -1) return;
            sourceParent.children.splice(sourceIndex, 1);

            targetNote.children.push(sourceNote);

            const newPath = [...targetPath, sourceNote.name];
            updateTabsAfterMove(sourcePath, newPath);

            markDirty();
            renderHierarchy();
            renderTabs();
        }

        // Render tabs
        function renderTabs() {
            const container = document.getElementById('tabs');
            const addBtn = document.getElementById('tab-add');

            while (container.firstChild !== addBtn) {
                container.removeChild(container.firstChild);
            }

            tabs.forEach((path, index) => {
                const note = getNoteByPath(path);
                const tab = document.createElement('div');
                tab.className = 'tab' + (index === activeTabIndex ? ' active' : '');

                const nameSpan = document.createElement('span');
                nameSpan.className = 'tab-name';
                nameSpan.textContent = note ? note.name : path[path.length - 1];
                tab.appendChild(nameSpan);

                const closeBtn = document.createElement('button');
                closeBtn.className = 'tab-close';
                closeBtn.textContent = '\u00d7';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeTab(index);
                });
                tab.appendChild(closeBtn);

                tab.addEventListener('click', () => {
                    if (activeTabIndex !== index) {
                        saveTabState();
                        activeTabIndex = index;
                        // Invalidate search when switching tabs with "all notes" off
                        if (!findAllNotes) {
                            invalidateSearch();
                        }
                        renderHierarchy();
                        renderTabs();
                        updateEditor();
                    } else {
                        // Re-focus editor without losing caret/selection
                        document.getElementById('editor').focus();
                    }
                });

                container.insertBefore(tab, addBtn);
            });
        }

        // Add new tab
        function addTab(path) {
            saveTabState();
            tabs.push(path);
            tabStates.push(null);
            activeTabIndex = tabs.length - 1;
            // Invalidate search when adding a new tab with "all notes" off
            if (!findAllNotes) {
                invalidateSearch();
            }
            renderHierarchy();
            renderTabs();
            updateEditor();
        }

        // Close tab
        function closeTab(index) {
            tabs.splice(index, 1);
            tabStates.splice(index, 1);
            if (tabs.length === 0) {
                addTab(getRootPath());
            } else {
                if (activeTabIndex >= tabs.length) {
                    activeTabIndex = tabs.length - 1;
                } else if (activeTabIndex > index) {
                    activeTabIndex--;
                }
                // Invalidate search when closing a tab changes the view with "all notes" off
                if (!findAllNotes) {
                    invalidateSearch();
                }
                renderTabs();
                updateEditor();
            }
        }

        // Save current tab state (scroll, caret, selection)
        function saveTabState() {
            if (activeTabIndex >= 0 && activeTabIndex < tabs.length) {
                const editor = document.getElementById('editor');
                tabStates[activeTabIndex] = {
                    scrollTop: editor.scrollTop,
                    selectionStart: editor.selectionStart,
                    selectionEnd: editor.selectionEnd
                };
            }
        }

        // Restore tab state
        function restoreTabState() {
            const editor = document.getElementById('editor');
            const state = tabStates[activeTabIndex];
            if (state) {
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    editor.scrollTop = state.scrollTop;
                    editor.focus();
                    editor.setSelectionRange(state.selectionStart, state.selectionEnd);
                    updateStatusBar();
                }, 0);
            } else {
                setTimeout(() => {
                    editor.scrollTop = 0;
                    editor.focus();
                    editor.setSelectionRange(0, 0);
                    updateStatusBar();
                }, 0);
            }
        }

        // Update editor content
        function updateEditor() {
            const editor = document.getElementById('editor');
            if (tabs.length === 0 || activeTabIndex >= tabs.length) {
                editor.value = '';
                updateLinkHighlights();
                updateStatusBar();
                return;
            }

            const note = getNoteByPath(tabs[activeTabIndex]);
            editor.value = note ? note.text : '';
            restoreTabState();
            updateLinkHighlights();
            firstFindMatchIsDirty = true; // Note changed, re-evaluate first match
            // updateStatusBar is called inside restoreTabState after selection is set
        }

        // Update link highlights in editor
        function updateLinkHighlights() {
            const overlay = document.getElementById('link-overlay');
            overlay.innerHTML = '';

            const editor = document.getElementById('editor');
            const text = editor.value;

            const wikiLinkPattern = /\[\[([a-zA-Z_][a-zA-Z0-9_]*(?:\/[a-zA-Z_][a-zA-Z0-9_]*)*)\]\]/g;
            const matches = [];
            let match;
            while ((match = wikiLinkPattern.exec(text)) !== null) {
                matches.push({ index: match.index, text: match[0], content: match[1] });
            }

            if (matches.length === 0) return;

            // Create a mirror div that matches the textarea exactly
            const mirror = document.createElement('div');
            const editorStyle = getComputedStyle(editor);
            mirror.style.cssText = `
                position: absolute;
                visibility: hidden;
                white-space: pre-wrap;
                word-wrap: break-word;
                overflow-wrap: break-word;
                font-family: ${editorStyle.fontFamily};
                font-size: ${editorStyle.fontSize};
                line-height: ${editorStyle.lineHeight};
                padding: ${editorStyle.padding};
                width: ${editor.clientWidth}px;
                border: none;
            `;
            document.body.appendChild(mirror);

            const lineHeight = parseFloat(editorStyle.lineHeight) || 21;

            for (const m of matches) {
                // Build mirror content with a marker span for this link
                const beforeText = text.substring(0, m.index);
                const linkText = m.text;

                // Escape HTML and preserve whitespace
                const escapeHtml = (str) => str
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                mirror.innerHTML = escapeHtml(beforeText) +
                    '<span id="link-marker">' + escapeHtml(linkText) + '</span>';

                const marker = mirror.querySelector('#link-marker');
                const mirrorRect = mirror.getBoundingClientRect();

                // Use getClientRects() to handle wrapped text (returns one rect per line)
                const rects = marker.getClientRects();

                for (const rect of rects) {
                    // Calculate position relative to mirror, then adjust for scroll
                    const left = rect.left - mirrorRect.left - editor.scrollLeft;
                    const top = rect.top - mirrorRect.top - editor.scrollTop;

                    const highlight = document.createElement('div');
                    highlight.className = 'link-highlight';
                    highlight.style.left = left + 'px';
                    highlight.style.top = top + 'px';
                    highlight.style.width = rect.width + 'px';
                    highlight.style.height = rect.height + 'px';
                    highlight.dataset.linkContent = m.content;

                    highlight.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateToWikiLink(e.target.dataset.linkContent);
                    });

                    highlight.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openLinkInNewTab(e.target.dataset.linkContent);
                    });

                    overlay.appendChild(highlight);
                }
            }

            document.body.removeChild(mirror);
        }

        // Show context menu
        function showContextMenu(x, y, path) {
            contextMenuTarget = path;
            const menu = document.getElementById('context-menu');
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
            menu.style.display = 'block';

            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = (window.innerWidth - rect.width - 5) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = (window.innerHeight - rect.height - 5) + 'px';
            }
        }

        // Hide context menu
        function hideContextMenu() {
            document.getElementById('context-menu').style.display = 'none';
            contextMenuTarget = null;
        }

        // Generate unique Untitled name
        function generateUntitledName(parent) {
            let suffix = 1;
            let name;
            do {
                name = 'Untitled_' + String(suffix).padStart(3, '0');
                suffix++;
            } while (parent.children.some(c => namesEqual(c.name, name)));
            return name;
        }

        // Create new note
        function createNote(parentPath) {
            const parent = getNoteByPath(parentPath);
            if (!parent) return;

            const defaultName = generateUntitledName(parent);
            const name = prompt('Enter note name:', defaultName);
            if (!name) return;

            if (!isValidNoteName(name)) {
                alert('Invalid note name. Must start with a letter or underscore, followed by letters, numbers, or underscores.');
                return;
            }

            if (parent.children.some(c => namesEqual(c.name, name))) {
                alert('A note with that name already exists.');
                return;
            }

            parent.children.push({ name, text: '', children: [] });
            markDirty();
            renderHierarchy();
        }

        // Rename note (including root)
        function renameNote(path) {
            const note = getNoteByPath(path);
            if (!note) return;

            const newName = prompt('Enter new name:', note.name);
            if (!newName || newName === note.name) return;

            if (!isValidNoteName(newName)) {
                alert('Invalid note name. Must start with a letter or underscore, followed by letters, numbers, or underscores.');
                return;
            }

            if (path.length > 1) {
                const parent = getParentByPath(path);
                if (parent.children.some(c => namesEqual(c.name, newName) && c !== note)) {
                    alert('A note with that name already exists.');
                    return;
                }
            }

            const oldName = note.name;
            note.name = newName;

            tabs = tabs.map(tabPath => {
                const newTabPath = [...tabPath];
                if (path.length === 1) {
                    if (namesEqual(newTabPath[0], oldName)) {
                        newTabPath[0] = newName;
                    }
                } else {
                    for (let i = 0; i < newTabPath.length; i++) {
                        if (i === path.length - 1 &&
                            JSON.stringify(newTabPath.slice(0, path.length).map(s => s.toLowerCase())) ===
                            JSON.stringify([...path.slice(0, -1), oldName].map(s => s.toLowerCase()))) {
                            newTabPath[i] = newName;
                        }
                    }
                }
                return newTabPath;
            });

            if (path.length === 1) {
                const newCollapsed = new Set();
                for (const key of collapsedPaths) {
                    const p = JSON.parse(key);
                    if (namesEqual(p[0], oldName)) {
                        p[0] = newName;
                    }
                    newCollapsed.add(JSON.stringify(p));
                }
                collapsedPaths = newCollapsed;
            }

            markDirty();
            renderHierarchy();
            renderTabs();
        }

        // Duplicate note
        function duplicateNote(path) {
            const note = getNoteByPath(path);
            if (!note) return;
            if (path.length === 1) {
                alert('Cannot duplicate root note.');
                return;
            }

            const parent = getParentByPath(path);
            if (!parent) return;

            let baseName = note.name;
            let startSuffix = 1;

            // Check if name already ends with _nnn pattern
            const suffixMatch = note.name.match(/_(\d{3})$/);
            if (suffixMatch) {
                baseName = note.name.slice(0, -4); // Remove the _nnn part
                startSuffix = parseInt(suffixMatch[1], 10) + 1;
            }

            let suffix = startSuffix;
            let newName;
            do {
                newName = baseName + '_' + String(suffix).padStart(3, '0');
                suffix++;
            } while (parent.children.some(c => namesEqual(c.name, newName)));

            const clone = cloneNote(note);
            clone.name = newName;
            parent.children.push(clone);

            markDirty();
            renderHierarchy();

            const newPath = [...path.slice(0, -1), newName];
            renameNote(newPath);
        }

        // Delete note
        function deleteNote(path) {
            if (path.length === 1) {
                alert('Cannot delete root note.');
                return;
            }

            const note = getNoteByPath(path);
            if (!note) return;

            if (!confirm(`Delete "${note.name}" and all its children?`)) return;

            const parent = getParentByPath(path);
            const index = parent.children.findIndex(c => c.name === note.name);
            if (index !== -1) {
                parent.children.splice(index, 1);
            }

            // Revert affected tabs to root instead of closing them
            tabs = tabs.map(tabPath => {
                if (JSON.stringify(tabPath.slice(0, path.length)) === JSON.stringify(path)) {
                    return getRootPath();
                }
                return tabPath;
            });

            markDirty();
            renderHierarchy();
            renderTabs();
            updateEditor();
        }

        // Get full path string
        function getPathString(path) {
            return path.join('/');
        }

        // Copy text to clipboard (with fallback for non-HTTPS)
        function copyToClipboard(text) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).catch(err => {
                    console.error('Failed to copy:', err);
                });
            } else {
                // Fallback for non-HTTPS contexts
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
                document.body.removeChild(textarea);
            }
        }

        // Open wiki link in new tab
        function openLinkInNewTab(linkContent) {
            const segments = linkContent.split('/');
            let foundPath = null;

            if (segments.length === 1) {
                foundPath = findNoteByName(segments[0], tabs[activeTabIndex]);
            } else {
                foundPath = findNoteByPathSegments(segments, tabs[activeTabIndex]);
            }

            if (foundPath) {
                addTab(foundPath);
            } else if (segments.length > 1) {
                // Path link not found - show alert
                alert(`Path not found: ${segments.join('/')}`);
            } else {
                const newName = segments[0];
                if (!isValidNoteName(newName)) {
                    alert('Invalid note name in link.');
                    return;
                }

                if (confirm(`Note "${newName}" not found. Create it?`)) {
                    if (!notesData.children.some(c => namesEqual(c.name, newName))) {
                        notesData.children.push({ name: newName, text: '', children: [] });
                        markDirty();
                        renderHierarchy();
                    }

                    addTab([...getRootPath(), newName]);
                }
            }
        }

        // Navigate to wiki link
        function navigateToWikiLink(linkContent) {
            const segments = linkContent.split('/');

            let foundPath = null;

            if (segments.length === 1) {
                foundPath = findNoteByName(segments[0], tabs[activeTabIndex]);
            } else {
                foundPath = findNoteByPathSegments(segments, tabs[activeTabIndex]);
            }

            saveTabState();
            if (foundPath) {
                tabs[activeTabIndex] = foundPath;
                tabStates[activeTabIndex] = null;
                // Invalidate search when switching notes with "all notes" off
                if (!findAllNotes) {
                    invalidateSearch();
                }
                renderHierarchy();
                renderTabs();
                updateEditor();
            } else if (segments.length > 1) {
                // Path link not found - show alert
                alert(`Path not found: ${segments.join('/')}`);
            } else {
                // Single-name link not found - ask to create
                const newName = segments[0];
                if (!isValidNoteName(newName)) {
                    alert('Invalid note name in link.');
                    return;
                }

                if (confirm(`Note "${newName}" not found. Create it?`)) {
                    if (!notesData.children.some(c => namesEqual(c.name, newName))) {
                        notesData.children.push({ name: newName, text: '', children: [] });
                        markDirty();
                        renderHierarchy();
                    }

                    tabs[activeTabIndex] = [...getRootPath(), newName];
                    tabStates[activeTabIndex] = null;
                    // Invalidate search when switching notes with "all notes" off
                    if (!findAllNotes) {
                        invalidateSearch();
                    }
                    renderHierarchy();
                    renderTabs();
                    updateEditor();
                }
            }
        }

        // Create bound copy (combines note and all children content)
        function createBoundCopy(path) {
            const note = getNoteByPath(path);
            if (!note) return;
            if (path.length === 1) {
                alert('Cannot create bound copy of root note.');
                return;
            }

            const parent = getParentByPath(path);
            if (!parent) return;

            // Collect all content from note and its children recursively
            function collectContent(n) {
                let content = n.text || '';
                for (const child of n.children) {
                    const childContent = collectContent(child);
                    if (childContent) {
                        content += (content ? '\n\n' : '') + childContent;
                    }
                }
                return content;
            }

            const combinedContent = collectContent(note);

            // Generate unique name with _bound suffix
            let baseName = note.name;
            // Remove existing _bound or _boundN suffix
            const boundMatch = note.name.match(/_bound(\d*)$/);
            if (boundMatch) {
                baseName = note.name.slice(0, -('_bound' + boundMatch[1]).length);
            }

            let newName = baseName + '_bound';
            let suffix = 2;
            while (parent.children.some(c => namesEqual(c.name, newName))) {
                newName = baseName + '_bound' + suffix;
                suffix++;
            }

            // Create new note with combined content (no children)
            parent.children.push({ name: newName, text: combinedContent, children: [] });

            markDirty();
            renderHierarchy();

            const newPath = [...path.slice(0, -1), newName];
            renameNote(newPath);
        }

        // Show properties dialog
        function showProperties(path) {
            const note = getNoteByPath(path);
            if (!note) return;

            // Count words in text
            function countWords(text) {
                if (!text || !text.trim()) return 0;
                return text.trim().split(/\s+/).length;
            }

            // Collect bound content (note + all descendants)
            function collectContent(n) {
                let content = n.text || '';
                for (const child of n.children) {
                    const childContent = collectContent(child);
                    if (childContent) {
                        content += (content ? '\n\n' : '') + childContent;
                    }
                }
                return content;
            }

            const noteText = note.text || '';
            const boundText = collectContent(note);

            // Count characters excluding whitespace
            function countChars(text) {
                return text.replace(/[\s\t\n\r]/g, '').length;
            }

            const charCount = countChars(noteText);
            const wordCount = countWords(noteText);
            const boundCharCount = countChars(boundText);
            const boundWordCount = countWords(boundText);

            alert(
                `Properties for "${note.name}"\n\n` +
                `Character count: ${charCount}\n` +
                `Word count: ${wordCount}\n` +
                `Bound character count: ${boundCharCount}\n` +
                `Bound word count: ${boundWordCount}`
            );
        }

        // Update status bar with caret position
        function updateStatusBar() {
            const editor = document.getElementById('editor');
            const text = editor.value;
            const pos = editor.selectionStart;

            const textBefore = text.substring(0, pos);
            const lines = textBefore.split('\n');
            const line = lines.length;
            const col = lines[lines.length - 1].length + 1;

            document.getElementById('status-bar').textContent = `Ln ${line}, Col ${col}`;
        }

        // Find functionality state
        let findMatches = [];
        let findCurrentIndex = -1;
        let findCurrentNotePath = null;
        let findUseRegex = false;
        let findMatchCase = false;
        let findAllNotes = false;
        let firstFindMatchIsDirty = false;
        let lastFindDirection = 'next';

        // Toggle find bar
        function toggleFindBar() {
            const findBar = document.getElementById('find-bar');
            if (findBar.style.display === 'none') {
                findBar.style.display = 'flex';
                // Sync state variables with checkbox states
                findUseRegex = document.getElementById('find-regex').checked;
                findMatchCase = document.getElementById('find-case').checked;
                findAllNotes = document.getElementById('find-all').checked;
                document.getElementById('find-input').focus();
                document.getElementById('find-input').select();
            } else {
                closeFindBar();
            }
        }

        // Close find bar
        function closeFindBar() {
            document.getElementById('find-bar').style.display = 'none';
            document.getElementById('find-status').textContent = '';
            findMatches = [];
            findCurrentIndex = -1;
            findCurrentNotePath = null;
        }

        // Collect all notes in order (current note first, then recursively through children)
        function collectNotesInOrder(startPath) {
            const result = [];
            const startNote = getNoteByPath(startPath);
            if (!startNote) return result;

            function collect(note, path) {
                result.push({ note, path });
                for (const child of note.children) {
                    collect(child, [...path, child.name]);
                }
            }

            collect(startNote, startPath);
            return result;
        }

        // Find all matches in text
        function findInText(text, searchText, useRegex, matchCase) {
            const matches = [];
            if (!searchText) return matches;

            try {
                let regex;
                if (useRegex) {
                    regex = new RegExp(searchText, matchCase ? 'g' : 'gi');
                } else {
                    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    regex = new RegExp(escaped, matchCase ? 'g' : 'gi');
                }

                let match;
                while ((match = regex.exec(text)) !== null) {
                    matches.push({ start: match.index, end: match.index + match[0].length });
                }
            } catch (e) {
                // Invalid regex
            }

            return matches;
        }

        // Perform find operation
        function performFind(direction) {
            const statusEl = document.getElementById('find-status');
            const searchText = document.getElementById('find-input').value;

            // Read current checkbox states
            const useRegex = findUseRegex;
            const matchCase = findMatchCase;
            const allNotes = findAllNotes;

            if (!searchText) {
                statusEl.textContent = '';
                return;
            }

            const currentPath = tabs[activeTabIndex];
            if (!currentPath) return;

            // Build list of notes to search
            let notesToSearch = [];
            if (allNotes) {
                // Search all notes starting from root
                notesToSearch = collectNotesInOrder(getRootPath());
            } else {
                const note = getNoteByPath(currentPath);
                if (note) {
                    notesToSearch = [{ note, path: currentPath }];
                }
            }

            // Collect all matches across notes
            let allMatches = [];
            for (const { note, path } of notesToSearch) {
                const textMatches = findInText(note.text || '', searchText, useRegex, matchCase);
                for (const m of textMatches) {
                    allMatches.push({ ...m, path, noteName: note.name });
                }
            }

            if (allMatches.length === 0) {
                statusEl.textContent = 'No matches found';
                findMatches = [];
                findCurrentIndex = -1;
                return;
            }

            findMatches = allMatches;

            // Determine starting index based on current position
            const editor = document.getElementById('editor');
            const cursorPos = editor.selectionStart;

            if (direction === 'next') {
                // Find next match after cursor
                let found = false;
                for (let i = 0; i < findMatches.length; i++) {
                    const m = findMatches[i];
                    const samePath = JSON.stringify(m.path) === JSON.stringify(currentPath);
                    if (samePath && m.start > cursorPos) {
                        findCurrentIndex = i;
                        found = true;
                        break;
                    } else if (!samePath && allNotes) {
                        // Different note, use first match there
                        findCurrentIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    findCurrentIndex = 0; // Wrap around
                }
            } else if (direction === 'prev') {
                // Find previous match before cursor
                let found = false;
                for (let i = findMatches.length - 1; i >= 0; i--) {
                    const m = findMatches[i];
                    const samePath = JSON.stringify(m.path) === JSON.stringify(currentPath);
                    if (samePath && m.end <= cursorPos) {
                        findCurrentIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    findCurrentIndex = findMatches.length - 1; // Wrap around
                }
            } else {
                findCurrentIndex = 0;
            }

            // Navigate to the match
            const match = findMatches[findCurrentIndex];
            if (JSON.stringify(match.path) !== JSON.stringify(currentPath)) {
                // Switch to different note
                saveTabState();
                tabs[activeTabIndex] = match.path;
                tabStates[activeTabIndex] = null;
                renderHierarchy();
                renderTabs();
                const note = getNoteByPath(match.path);
                editor.value = note ? note.text : '';
                updateLinkHighlights();
            }

            // Select the match
            editor.focus();
            editor.setSelectionRange(match.start, match.end);
            updateStatusBar();

            // Scroll into view if needed
            const lineHeight = 21;
            const textBefore = editor.value.substring(0, match.start);
            const lineNum = textBefore.split('\n').length - 1;
            const scrollTarget = lineNum * lineHeight - editor.clientHeight / 2;
            editor.scrollTop = Math.max(0, scrollTarget);

            statusEl.textContent = `${findCurrentIndex + 1} of ${findMatches.length}`;
            firstFindMatchIsDirty = false;
        }

        // Find next
        function findNext() {
            lastFindDirection = 'next';
            if (findMatches.length > 0) {
                if (firstFindMatchIsDirty) {
                    reEvaluateFirstMatch('next');
                    firstFindMatchIsDirty = false;
                } else {
                    findCurrentIndex = (findCurrentIndex + 1) % findMatches.length;
                }
                navigateToMatch();
            } else {
                performFind('next');
            }
        }

        // Find previous
        function findPrev() {
            lastFindDirection = 'prev';
            if (findMatches.length > 0) {
                if (firstFindMatchIsDirty) {
                    reEvaluateFirstMatch('prev');
                    firstFindMatchIsDirty = false;
                } else {
                    findCurrentIndex = (findCurrentIndex - 1 + findMatches.length) % findMatches.length;
                }
                navigateToMatch();
            } else {
                performFind('prev');
            }
        }

        // Replace current match
        function replaceOne() {
            if (findMatches.length === 0 || findCurrentIndex < 0) {
                // No match selected, try to find one first
                if (lastFindDirection === 'prev') {
                    findPrev();
                } else {
                    findNext();
                }
                return;
            }

            let match = findMatches[findCurrentIndex];
            const currentPath = tabs[activeTabIndex];
            const editor = document.getElementById('editor');

            // Check if we're on the right note and the match is selected
            const onRightNote = JSON.stringify(match.path) === JSON.stringify(currentPath);
            const matchSelected = editor.selectionStart === match.start && editor.selectionEnd === match.end;

            if (!onRightNote || !matchSelected) {
                // Cursor has moved - re-evaluate which match to use based on cursor position
                reEvaluateFirstMatch(lastFindDirection);
                match = findMatches[findCurrentIndex];

                // Now navigate to this match and wait for user to press Replace again
                navigateToMatch();
                return;
            }

            const searchText = document.getElementById('find-input').value;
            const replaceText = document.getElementById('replace-input').value;
            const note = getNoteByPath(match.path);
            if (!note) return;

            let newText;
            let replacementLength;
            if (findUseRegex) {
                // Use regex replacement
                try {
                    const flags = findMatchCase ? '' : 'i';
                    const regex = new RegExp(searchText, flags);
                    const matchText = note.text.substring(match.start, match.end);
                    const replacedMatch = matchText.replace(regex, replaceText);
                    replacementLength = replacedMatch.length;
                    newText = note.text.substring(0, match.start) + replacedMatch + note.text.substring(match.end);
                } catch (e) {
                    alert('Invalid regex');
                    return;
                }
            } else {
                // Simple replacement
                replacementLength = replaceText.length;
                newText = note.text.substring(0, match.start) + replaceText + note.text.substring(match.end);
            }

            note.text = newText;
            editor.value = newText;
            markDirty();
            updateLinkHighlights();

            // Position cursor at end of replacement for proper next/prev finding
            const newCursorPos = match.start + replacementLength;
            editor.setSelectionRange(newCursorPos, newCursorPos);

            // Invalidate search and find next/prev
            invalidateSearch();
            if (lastFindDirection === 'prev') {
                findPrev();
            } else {
                findNext();
            }
        }

        // Replace all matches
        function replaceAll() {
            const searchText = document.getElementById('find-input').value;
            const replaceText = document.getElementById('replace-input').value;

            if (!searchText) return;

            // Build list of notes to search
            const currentPath = tabs[activeTabIndex];
            let notesToSearch = [];
            if (findAllNotes) {
                notesToSearch = collectNotesInOrder(getRootPath());
            } else {
                const note = getNoteByPath(currentPath);
                if (note) {
                    notesToSearch = [{ note, path: currentPath }];
                }
            }

            let totalReplacements = 0;

            try {
                let regex;
                if (findUseRegex) {
                    regex = new RegExp(searchText, findMatchCase ? 'g' : 'gi');
                } else {
                    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    regex = new RegExp(escaped, findMatchCase ? 'g' : 'gi');
                }

                for (const { note } of notesToSearch) {
                    const originalText = note.text || '';
                    const newText = originalText.replace(regex, replaceText);
                    if (newText !== originalText) {
                        const matches = originalText.match(regex);
                        totalReplacements += matches ? matches.length : 0;
                        note.text = newText;
                    }
                }
            } catch (e) {
                alert('Invalid regex');
                return;
            }

            if (totalReplacements > 0) {
                markDirty();
                // Update editor if current note was modified
                const currentNote = getNoteByPath(currentPath);
                if (currentNote) {
                    document.getElementById('editor').value = currentNote.text;
                }
                updateLinkHighlights();
                invalidateSearch();
            }

            document.getElementById('find-status').textContent = `Replaced ${totalReplacements} occurrence${totalReplacements !== 1 ? 's' : ''}`;
        }

        // Invalidate search (when content changes)
        function invalidateSearch() {
            if (document.getElementById('find-bar').style.display !== 'none') {
                findMatches = [];
                findCurrentIndex = -1;
                document.getElementById('find-status').textContent = '';
            }
        }

        // Re-evaluate first match based on current position (without re-searching)
        function reEvaluateFirstMatch(direction) {
            if (findMatches.length === 0) return;

            const currentPath = tabs[activeTabIndex];
            const editor = document.getElementById('editor');
            const cursorPos = editor.selectionStart;
            const currentPathStr = JSON.stringify(currentPath);

            // Get the note order to determine which notes come before/after current
            const noteOrder = findAllNotes ?
                collectNotesInOrder(getRootPath()) :
                [{ path: currentPath }];

            // Find the index of the current note in the traversal order
            const currentNoteOrderIndex = noteOrder.findIndex(n =>
                JSON.stringify(n.path) === currentPathStr
            );

            if (direction === 'prev') {
                // Find last match before cursor in current note
                for (let i = findMatches.length - 1; i >= 0; i--) {
                    const m = findMatches[i];
                    if (JSON.stringify(m.path) === currentPathStr && m.end <= cursorPos) {
                        findCurrentIndex = i;
                        document.getElementById('find-status').textContent = `${findCurrentIndex + 1} of ${findMatches.length}`;
                        return;
                    }
                }

                // Find last match in a note that comes before current note in traversal order
                for (let i = findMatches.length - 1; i >= 0; i--) {
                    const m = findMatches[i];
                    const matchNoteOrderIndex = noteOrder.findIndex(n =>
                        JSON.stringify(n.path) === JSON.stringify(m.path)
                    );
                    if (matchNoteOrderIndex < currentNoteOrderIndex) {
                        findCurrentIndex = i;
                        document.getElementById('find-status').textContent = `${findCurrentIndex + 1} of ${findMatches.length}`;
                        return;
                    }
                }

                // Wrap to last match
                findCurrentIndex = findMatches.length - 1;
            } else {
                // direction === 'next' (default)
                // Find first match at or after cursor in current note
                for (let i = 0; i < findMatches.length; i++) {
                    const m = findMatches[i];
                    if (JSON.stringify(m.path) === currentPathStr && m.start >= cursorPos) {
                        findCurrentIndex = i;
                        document.getElementById('find-status').textContent = `${findCurrentIndex + 1} of ${findMatches.length}`;
                        return;
                    }
                }

                // Find first match in a note that comes after current note in traversal order
                for (let i = 0; i < findMatches.length; i++) {
                    const m = findMatches[i];
                    const matchNoteOrderIndex = noteOrder.findIndex(n =>
                        JSON.stringify(n.path) === JSON.stringify(m.path)
                    );
                    if (matchNoteOrderIndex > currentNoteOrderIndex) {
                        findCurrentIndex = i;
                        document.getElementById('find-status').textContent = `${findCurrentIndex + 1} of ${findMatches.length}`;
                        return;
                    }
                }

                // Wrap to first match
                findCurrentIndex = 0;
            }

            document.getElementById('find-status').textContent = `${findCurrentIndex + 1} of ${findMatches.length}`;
        }

        // Navigate to current match
        function navigateToMatch() {
            if (findCurrentIndex < 0 || findCurrentIndex >= findMatches.length) return;

            const match = findMatches[findCurrentIndex];
            const currentPath = tabs[activeTabIndex];
            const editor = document.getElementById('editor');

            if (JSON.stringify(match.path) !== JSON.stringify(currentPath)) {
                saveTabState();
                tabs[activeTabIndex] = match.path;
                tabStates[activeTabIndex] = null;
                renderHierarchy();
                renderTabs();
                const note = getNoteByPath(match.path);
                editor.value = note ? note.text : '';
                updateLinkHighlights();
            }

            editor.focus();
            editor.setSelectionRange(match.start, match.end);
            updateStatusBar();

            const lineHeight = 21;
            const textBefore = editor.value.substring(0, match.start);
            const lineNum = textBefore.split('\n').length - 1;
            const scrollTarget = lineNum * lineHeight - editor.clientHeight / 2;
            editor.scrollTop = Math.max(0, scrollTarget);

            document.getElementById('find-status').textContent = `${findCurrentIndex + 1} of ${findMatches.length}`;
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadNotes();

            const editor = document.getElementById('editor');

            editor.addEventListener('input', () => {
                if (tabs.length === 0 || activeTabIndex >= tabs.length) return;
                const note = getNoteByPath(tabs[activeTabIndex]);
                if (note) {
                    note.text = editor.value;
                    markDirty();
                    updateLinkHighlights();
                    invalidateSearch(); // Content changed, reset search
                }
            });

            // Copy scaffolding when pressing Enter
            editor.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    const cursorPos = editor.selectionStart;
                    const text = editor.value;

                    // Find the start of the current line
                    let lineStart = cursorPos;
                    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
                        lineStart--;
                    }

                    // Extract the current line up to cursor
                    const currentLine = text.substring(lineStart, cursorPos);

                    // Match scaffolding: spaces, tabs, dashes, equals, numbers, periods, closing parens, closing angle brackets
                    const scaffoldingMatch = currentLine.match(/^[ \t\-=0-9.)>]*/);
                    let scaffolding = scaffoldingMatch ? scaffoldingMatch[0] : '';

                    // Increment any number clusters in the scaffolding
                    scaffolding = scaffolding.replace(/\d+/g, match => String(parseInt(match, 10) + 1));

                    if (scaffolding.length > 0) {
                        e.preventDefault();

                        // Insert newline + scaffolding
                        const before = text.substring(0, cursorPos);
                        const after = text.substring(editor.selectionEnd);
                        const insertion = '\n' + scaffolding;

                        editor.value = before + insertion + after;

                        // Position cursor after the scaffolding
                        const newPos = cursorPos + insertion.length;
                        editor.selectionStart = newPos;
                        editor.selectionEnd = newPos;

                        // Trigger input event to save changes
                        editor.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });

            // Multi-line indent/outdent with space/tab when selection starts at line start
            editor.addEventListener('keydown', (e) => {
                const isSpace = e.key === ' ' && !e.ctrlKey && !e.altKey && !e.metaKey;
                const isTab = e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey;
                const isShiftTab = e.key === 'Tab' && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey;

                if (!isSpace && !isTab) return;

                const selStart = editor.selectionStart;
                const selEnd = editor.selectionEnd;
                const text = editor.value;

                // Check if selection starts at the start of a line
                const atLineStart = selStart === 0 || text[selStart - 1] === '\n';
                if (!atLineStart) return;

                // Must have a selection for this feature
                if (selStart === selEnd) return;

                e.preventDefault();

                // Get the selected text and split into lines
                const selected = text.substring(selStart, selEnd);
                const lines = selected.split('\n');

                let newLines;
                if (isShiftTab) {
                    // Remove one whitespace character from each line start (if present)
                    newLines = lines.map(line => {
                        if (line.length > 0 && (line[0] === ' ' || line[0] === '\t')) {
                            return line.substring(1);
                        }
                        return line;
                    });
                } else {
                    // Prepend space or tab to each non-empty line
                    const char = isTab ? '\t' : ' ';
                    newLines = lines.map(line => {
                        // Skip empty lines (only whitespace)
                        if (/^\s*$/.test(line)) {
                            return line;
                        }
                        return char + line;
                    });
                }

                const newSelected = newLines.join('\n');

                // Use execCommand to make this undo-able
                document.execCommand('insertText', false, newSelected);

                // Restore selection over the modified text
                editor.selectionStart = selStart;
                editor.selectionEnd = selStart + newSelected.length;
            });

            editor.addEventListener('scroll', () => {
                updateLinkHighlights();
            });

            editor.addEventListener('click', () => {
                updateStatusBar();
                firstFindMatchIsDirty = true;
            });
            editor.addEventListener('keyup', () => {
                updateStatusBar();
                firstFindMatchIsDirty = true;
            });
            editor.addEventListener('input', updateStatusBar);

            document.getElementById('tab-add').addEventListener('click', () => {
                addTab(getRootPath());
            });

            document.getElementById('btn-save').addEventListener('click', () => {
                saveNotes();
            });

            document.getElementById('btn-new').addEventListener('click', () => {
                const currentPath = tabs[activeTabIndex] || getRootPath();
                createNote(currentPath);
            });

            document.getElementById('btn-find').addEventListener('click', () => {
                toggleFindBar();
            });

            document.getElementById('find-close').addEventListener('click', () => {
                closeFindBar();
            });

            document.getElementById('find-next').addEventListener('click', () => {
                findNext();
            });

            document.getElementById('find-prev').addEventListener('click', () => {
                findPrev();
            });

            document.getElementById('find-input').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        findPrev();
                    } else {
                        findNext();
                    }
                } else if (e.key === 'Escape') {
                    closeFindBar();
                }
            });

            document.getElementById('find-input').addEventListener('input', () => {
                // Reset matches when search text changes
                findMatches = [];
                findCurrentIndex = -1;
                document.getElementById('find-status').textContent = '';
            });

            // Re-search when options change
            document.getElementById('find-regex').addEventListener('change', function() {
                findUseRegex = this.checked;
                findMatches = [];
                findCurrentIndex = -1;
                firstFindMatchIsDirty = true;
                if (document.getElementById('find-input').value) {
                    performFind('next');
                }
            });

            document.getElementById('find-case').addEventListener('change', function() {
                findMatchCase = this.checked;
                findMatches = [];
                findCurrentIndex = -1;
                firstFindMatchIsDirty = true;
                if (document.getElementById('find-input').value) {
                    performFind('next');
                }
            });

            document.getElementById('find-all').addEventListener('change', function() {
                findAllNotes = this.checked;
                findMatches = [];
                findCurrentIndex = -1;
                firstFindMatchIsDirty = true;
                if (document.getElementById('find-input').value) {
                    performFind('next');
                }
            });

            document.getElementById('replace-one').addEventListener('click', () => {
                replaceOne();
            });

            document.getElementById('replace-all').addEventListener('click', () => {
                replaceAll();
            });

            document.getElementById('btn-back').addEventListener('click', () => {
                if (isDirty) {
                    if (!confirm('You have unsaved changes. Leave anyway?')) {
                        return;
                    }
                }
                window.location.href = window.location.pathname;
            });

            document.getElementById('context-menu').addEventListener('click', (e) => {
                const menuItem = e.target.closest('[data-action]');
                if (!menuItem || !contextMenuTarget) return;

                const action = menuItem.dataset.action;
                const targetPath = contextMenuTarget;

                switch (action) {
                    case 'new':
                        createNote(targetPath);
                        break;
                    case 'rename':
                        renameNote(targetPath);
                        break;
                    case 'duplicate':
                        duplicateNote(targetPath);
                        break;
                    case 'delete':
                        deleteNote(targetPath);
                        break;
                    case 'copy-name': {
                        const noteToCopy = getNoteByPath(targetPath);
                        if (noteToCopy) {
                            copyToClipboard(noteToCopy.name);
                        }
                        break;
                    }
                    case 'copy-path': {
                        copyToClipboard(getPathString(targetPath));
                        break;
                    }
                    case 'bound-copy':
                        createBoundCopy(targetPath);
                        break;
                    case 'properties':
                        showProperties(targetPath);
                        break;
                }

                hideContextMenu();
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#context-menu')) {
                    hideContextMenu();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    hideContextMenu();
                }
                if (e.key === 'Delete' && !e.target.matches('input, textarea')) {
                    const currentPath = tabs[activeTabIndex];
                    if (currentPath && currentPath.length > 1) {
                        deleteNote(currentPath);
                    }
                }
                // Ctrl+F to open find bar
                if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    toggleFindBar();
                }
            });

            window.addEventListener('beforeunload', (e) => {
                if (isDirty) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                    return e.returnValue;
                }
            });

            window.addEventListener('resize', () => {
                updateLinkHighlights();
            });

            // Sidebar resizer
            const resizer = document.getElementById('sidebar-resizer');
            const sidebar = document.getElementById('sidebar');
            let isResizing = false;

            // Snap behavior constants
            const barWidth = 15;
            const snapThreshold = barWidth * 3;              // 45px - threshold when unsnapped
            const snapOutThreshold = barWidth * 0.5;         // 7.5px - threshold to pop out from snapped

            let startedSnapped = false;  // Whether drag started in snapped state
            let followOffset = 0;

            // Restore sidebar width from localStorage
            const savedWidth = localStorage.getItem('sidebarWidth');
            if (savedWidth !== null) {
                sidebar.style.width = savedWidth + 'px';
            }

            function startResize(e) {
                isResizing = true;
                resizer.classList.add('dragging');
                document.body.style.cursor = 'ew-resize';
                document.body.style.userSelect = 'none';
                e.preventDefault();
                e.stopPropagation();

                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                startedSnapped = sidebar.offsetWidth === 0;

                if (!startedSnapped) {
                    // Calculate offset to maintain finger position on bar
                    followOffset = sidebar.offsetWidth - clientX;
                }
            }

            function doResize(e) {
                if (!isResizing) return;
                // Prevent browser back gesture on touch
                if (e.cancelable) {
                    e.preventDefault();
                }
                e.stopPropagation();

                const clientX = e.touches ? e.touches[0].clientX : e.clientX;

                if (startedSnapped) {
                    // Started snapped: stay snapped until threshold, then pop out and end drag
                    if (clientX >= snapOutThreshold) {
                        sidebar.style.width = snapThreshold + 'px';
                        updateLinkHighlights();
                        stopResize();
                    } else {
                        sidebar.style.width = '0px';
                    }
                } else {
                    // Normal unsnapped behavior
                    if (clientX < snapThreshold) {
                        sidebar.style.width = '0px';
                    } else {
                        sidebar.style.width = Math.max(0, clientX + followOffset) + 'px';
                    }
                    updateLinkHighlights();
                }
            }

            function stopResize() {
                if (!isResizing) return;
                isResizing = false;
                resizer.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                // Save sidebar width to localStorage
                localStorage.setItem('sidebarWidth', sidebar.offsetWidth);
            }

            resizer.addEventListener('mousedown', startResize);
            resizer.addEventListener('touchstart', startResize, { passive: false });
            document.addEventListener('mousemove', doResize);
            document.addEventListener('touchmove', doResize, { passive: false });
            document.addEventListener('mouseup', stopResize);
            document.addEventListener('touchend', stopResize);

            // Handle mobile keyboard with Visual Viewport API
            if (window.visualViewport) {
                const updateViewportHeight = () => {
                    const vh = window.visualViewport.height;
                    document.documentElement.style.height = vh + 'px';
                    document.body.style.height = vh + 'px';

                    // Scroll active note into view in hierarchy after keyboard resize
                    const activeNote = document.querySelector('.note-item.active');
                    if (activeNote) {
                        const hierarchy = document.getElementById('hierarchy');
                        const noteRect = activeNote.getBoundingClientRect();
                        const hierarchyRect = hierarchy.getBoundingClientRect();

                        // Check if note is outside visible area
                        if (noteRect.top < hierarchyRect.top) {
                            activeNote.scrollIntoView({ block: 'start', behavior: 'instant' });
                        } else if (noteRect.bottom > hierarchyRect.bottom) {
                            activeNote.scrollIntoView({ block: 'end', behavior: 'instant' });
                        }
                    }
                };
                window.visualViewport.addEventListener('resize', updateViewportHeight);
                window.visualViewport.addEventListener('scroll', () => {
                    // Prevent page from scrolling when keyboard appears
                    window.scrollTo(0, 0);
                });
            }
        });
    </script>
</body>
</html>
