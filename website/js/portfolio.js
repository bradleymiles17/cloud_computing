/*global Birdception _config*/

var Birdception = window.Birdception || {};

(function rideScopeWrapper($) {
    var authToken;

    Birdception.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    // Register click handler for #request button
    $(function onDocReady() {

        // get images and populate portfolio
        pageLoad();

        $('#classifyForm').submit(uploadFile);
        $('#signOut').click(signOut);

    });


    function pageLoad() {

        // delete all child doms
        var myNode = document.getElementById("photos");
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }

        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/index',
            headers: {
                Authorization: authToken
            },
            success: function(birds) {
                birds.forEach(function(bird) {
                    var html =
                        '<div class="column">' +
                            '<img src="' + bird.url + '" alt="Birds">' +
                            '<div class="metadata">' +
                                '<div class="breed">' +
                                    '<p>' + bird.classification + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>';

                    $('#photos').append(html);
                });
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occurred when classifying your photo:\n' + jqXHR.responseText);
            }
        });
    }


    function uploadFile(e) {
        e.preventDefault(); // avoid to execute the actual submit of the form.

        var f = document.getElementById("file").files[0];

        var reader = new FileReader();
        reader.onload = function() {
            $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/classify',
                headers: {
                    Authorization: authToken,
                    "Content-Type": 'application/json'
                },
                data: JSON.stringify(
                    {
                        name: f.name,
                        type: f.type,
                        size: f.size,
                        rawBase64: reader.result
                    }
                ),
                success: completeRequest,
                error: function ajaxError(jqXHR, textStatus, errorThrown) {
                    console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                    console.error('Response: ', jqXHR.responseText);
                    alert('An error occurred when classifying your photo:\n' + jqXHR.responseText);
                }
            });
        };

        if (f) {
            reader.readAsDataURL(f);
        }

    }

    function completeRequest(result) {
        console.log('Response received from API: ', result);
        document.getElementById("file").value = "";
        pageLoad();
    }

    function signOut() {
        Birdception.signOut();
        alert("You have been signed out.");
        window.location = "index.html";
    }

}(jQuery));
