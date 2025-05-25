<?
require_once('../common.php');
HeaderRender();

$LUN = ArElGetSafe($_POST, 'UN');
$LPWD = ArElGetSafe($_POST, 'PWD');
DW('$LUN', $LUN);
if(isset($LUN) && isset($LPWD) && UserIDGet($LUN, $LPWD))
{
  setcookie('UserName', $LUN , time() + 3000 * 24 * 60 * 60);
  setcookie('UserPWD' , $LPWD, time() + 3000 * 24 * 60 * 60);

  header('Location: a.php');
  exit;
}

?>

<form method="post">
UN: <input type="text" name="UN" size="5">
PWD: <input type="password" name="PWD">
<input type="submit">
</form>