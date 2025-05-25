<?
require_once('../common.php');
$ModeIsJSON = @$_GET['mode'] === 'json';


$Stat = pg_fetch_all(pg_query_params($Con, '
  SELECT D::date d, DS.*
  FROM generate_series(CURRENT_DATE - interval \'30 day\', CURRENT_DATE, interval \'1 day\') D
    LEFT JOIN daily_stat DS
      ON DS.day = D AND DS.user_id = $1
  ORDER BY D DESC',
  [$UserID]
));

if($ModeIsJSON)
{
  CORSHeadersRender();
  echo json_encode($Stat);
  exit;
}

HeaderRender();
?>

<a href="a.php">words</a><br><br>

<table border=1>
<tr><th rowspan="2">Day<th colspan="2">e2u<th colspan="2">u2e<th rowspan="2">Sum</tr>
<tr><th>right<th>wrong<th>right<th>wrong</tr>

<?
if($Stat)
  foreach($Stat as $Row)
  {
    $Sum =
      $Row['e2u_right_count'] +
      $Row['e2u_wrong_count'] +
      $Row['u2e_right_count'] +
      $Row['u2e_wrong_count'];

    ?><tr><?
      ?><td><?=$Row['d']?></td><?
      ?><td class="number"><?=$Row['e2u_right_count']?></td><?
      ?><td class="number"><?=$Row['e2u_wrong_count']?></td><?
      ?><td class="number"><?=$Row['u2e_right_count']?></td><?
      ?><td class="number"><?=$Row['u2e_wrong_count']?></td><?
      ?><td class="number"><?=$Sum?></td><?
    ?></tr><?
  }
?>

</table>