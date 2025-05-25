<?
$DO_NOT_REDIRECT_TO_LOGON = true;
require_once('../common.php');
if(!isset($UserID))
{
}

header('Content-Type: application/json; charset=utf-8');
CORSHeadersRender();

function _404()
{
  header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found');
  print '404 Not Found';
  exit;
}

function IntParamGet($AName)
{
  $R = @$_GET[$AName];
  if(!isset($R)
    || (strlen($R) > 9)
    || !ctype_digit($R)
  )
    _404();
  return intval($R);
}

function Process_Words()
{
  global $UserID;
  $LOrder = @$_GET['order'];
  if(isset($LOrder))
    switch($LOrder) {
    case 'n':
      $LOrder = 'word';
      break;
    case 't':
      $LOrder = 'translation';
      break;
    case 'te':
      $LOrder = CheckSortByBuild('e2u');
      break;
    case 'tu':
      $LOrder = CheckSortByBuild('u2e');
      break;
    default:
      _404();
    }
  else
    $LOrder = 'date_created DESC';

  $LPageNo = IntParamGet('pn');
  $LLimit = IntParamGet('limit');

  $LSQL = '
    SELECT W.id, W.word, W.translation,
    ' . CheckSortByBuild('e2u') . ' rank_en,
    ' . CheckSortByBuild('u2e') . ' rank_uk
    FROM words W
      LEFT JOIN word_users WU
        ON (WU.word_id, WU.user_id) = (W.id, ' . $UserID . ')
    WHERE not is_deleted
    ORDER BY ' . $LOrder . '
    LIMIT ' . $LLimit;
  if($LPageNo > 1)
    $LSQL .= '
      OFFSET ' . (($LPageNo - 1) * $LLimit);
  //print $LSQL;exit;
  global $Con;
  echo json_encode(pg_fetch_all(pg_query($Con, $LSQL)), JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

switch(@$_GET['type']) {

case 'words':
  Process_Words();
  break;

default:
  _404();
}
?>