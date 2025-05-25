<?
ini_set('display_errors', 'On');

function ArElGetSafe($Ar, $Key)
{
  if(isset($Ar[$Key]))
    return $Ar[$Key];
}

function DW($AName, $AVal)
{
  print_r('<pre>');
  print_r('<b>' . $AName . ':</b> ');
  print_r($AVal);
  print_r('</pre>');
}

$Con = pg_connect('dbname=vocabulary user=uvocabulary password=xkjdyvxjr');

function UserIDGet($AUN, $APWD)
{
  global $Con;
  $R = pg_fetch_all(pg_query_params($Con, 'SELECT id FROM users WHERE name = $1 AND pwd = $2', [$AUN, $APWD]));
  if($R)
    return $R[0]['id'];
}

$UserID = UserIDGet(ArElGetSafe($_COOKIE, 'UserName'), ArElGetSafe($_COOKIE, 'UserPWD'));
if(!$UserID)
  $UserID = 2;

if(!$UserID && ($_SERVER['SCRIPT_NAME'] != '/Logon.php'))
{
  // if($DO_NOT_REDIRECT_TO_LOGON) 
  //   ;
  // else 
  {
    header('Location: Logon.php');
    exit;
  }
}

function CheckSortByBuild($APrefix, $ANormalize = false, $ATableAliasSuffix = '')
{
  $R = "(Coalesce(WU{$ATableAliasSuffix}.{$APrefix}_right_count, 0) - 2 * Coalesce(WU{$ATableAliasSuffix}.{$APrefix}_wrong_count, 0) + Coalesce(WU{$ATableAliasSuffix}.{$APrefix}_coef, 0))";
  if($ANormalize)
    $R .= ' / 3';
  return $R;
}

function CORSHeadersRender()
{
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POS');
}

function HeaderRender()
{
?>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<script src="common.js?<?/*=microtime(true)*/?>"></script>
<style>
body {
  font-family: helvetica;
  margin: 4px;
}

.RootPageTopNavigator {
  background-color: white;
  qborder-bottom: 1px solid black;
  left: 0;
  padding: 4px;
  position: fixed;
  top: 0;
  width: 100%;
}

.material-icons {
  user-select: none;
}

table {
  border-color: silver;
  border-collapse:collapse;
}

th, td {
  padding: 2px 3px;
}
.number {
  text-align: right;
}

.filtered .hidden {
  display: none;
}
</style>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<?
}
?>