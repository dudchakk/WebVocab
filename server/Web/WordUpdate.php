<?
require_once('../common.php');

$LKey = isset($_GET['key']) ? $_GET['key'] : '';
$ModeIsJSON = @$_GET['mode'] === 'json';
if($ModeIsJSON)
  CORSHeadersRender();

if(isset($_GET['submit']))
{
  if($_GET['submit'] == 'Delete')
  {
    $LSQL = '
      UPDATE words
      SET is_deleted = true
      WHERE word = $1';
    pg_query_params($Con, $LSQL, [$LKey]);
    $LMessage = 'deleted';
  }
  else
  if($LKey)
  {
    $LSQL = 'UPDATE words
      SET
        word          = $1,
        translation   = $2,
        updated_by    = $4,
        date_updated  = now()
      WHERE word = $3';
    pg_query_params($Con, $LSQL, [$_GET['word'], $_GET['translation'], $LKey, $UserID]);
    $LMessage = 'updated';
  }
  else
  {
    $LSQL = 'INSERT INTO words(word, translation, created_by, updated_by) VALUES($1, $2, $3, $3)';
    pg_query_params($Con, $LSQL, [$_GET['word'], $_GET['translation'], $UserID]);
    $LMessage = 'added';
  }
  if($ModeIsJSON)
  { echo json_encode([$LMessage]); }
  else
  { ?><script>alert('<?=$LMessage?>');location.href = 'a.php';</script><? }
  exit;
}

$Word = '';
if($LKey)
{
  $LSQL = 'SELECT * FROM words WHERE word = $1';
  $Word = pg_fetch_all(pg_query_params($Con, $LSQL, [$LKey]));
  if($Word)
    $Word = $Word[0];
}

HeaderRender();
?>

<script>
function Translate(AWord)
{
  window.open('https://translate.google.com/?sl=auto&tl=uk&text=' + AWord + '&op=translate');
}
</script>
<form method="get">
<input type="hidden" name="key" value="<?=$LKey?>">
<input type="hidden" name="mode" value="json">
<?=$Word ? 'Edit' : 'Add New'?> Word:
<?
if($Word)
{
  $LSQL = '
    SELECT string_agg(array_to_string(Array[WU.e2u_right_count, WU.e2u_wrong_count, WU.u2e_right_count, WU.u2e_wrong_count], \' / \'), \' , \' ORDER BY WU.user_id) stat
    FROM word_users WU
    WHERE WU.word_id = $1
      AND ($2 = 1 OR WU.user_id = $2)';
  $Stat = pg_fetch_all(pg_query_params($Con, $LSQL, [$Word['id'], $UserID]));
  ?>(<?=$Stat[0]['stat']?>)<?
}
?>
<br>
<table>
<tr><th>Word:</th><td><input id="word" type="text" name="word" value="<?=$Word ? $Word['word'] : ''?>"> <button onclick="Speak(document.getElementById('word').value, event);return false">speak</button> <button onclick="Translate(document.getElementById('word').value);return false">translate</button></td></tr>
<tr><th>Translation:</th><td><input type="text" name="translation" value="<?=$Word ? $Word['translation'] : ''?>"></td></tr>
<tr><td colspan="2" style="text-align:right">
<?
  if($LKey)
  { ?><input type="submit" name="submit" value="Delete" onclick="return confirm('are you sure you want to delete this word?')" style="margin-right:10px"/><? }
?>
  <input type="submit" name="submit" value="<?=$Word ? 'Update' : 'Add'?>"/>
</td></tr>
</table>
</form>